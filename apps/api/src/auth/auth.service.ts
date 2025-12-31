import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider } from 'prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        provider: AuthProvider.LOCAL,
      },
    });

    return this.generateToken(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password || user.provider !== AuthProvider.LOCAL) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }

  async validateOidcUser(profile: any): Promise<User> {
    const email = profile.emails?.[0]?.value;
    const providerId = profile.id;

    if (!email) {
      throw new UnauthorizedException('Email not provided by OIDC provider');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { providerId },
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          providerId,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          provider: AuthProvider.OIDC,
        },
      });
    } else if (user.provider !== AuthProvider.OIDC) {
      throw new ConflictException('User already exists with email/password authentication');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }

  async login(user: User) {
    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }

  // ==================== Password Reset ====================

  async forgotPassword(email: string): Promise<{ mailSent: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not
    if (!user) {
      return { mailSent: false };
    }

    // OIDC users cannot reset password
    if (user.provider !== AuthProvider.LOCAL || !user.password) {
      return { mailSent: false };
    }

    // Invalidate any existing reset tokens
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Create new reset token (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const resetToken = await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });

    // Send password reset email
    const mailSent = await this.mailService.sendPasswordResetEmail(
      user.email,
      resetToken.token,
      user.name,
    );

    return { mailSent };
  }

  async verifyResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            provider: true,
          },
        },
      },
    });

    if (!resetToken) {
      throw new NotFoundException('Invalid reset token');
    }

    if (resetToken.isUsed) {
      throw new BadRequestException('This reset token has already been used');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('This reset token has expired');
    }

    if (resetToken.user.provider !== AuthProvider.LOCAL) {
      throw new BadRequestException('Password reset not available for OIDC users');
    }

    return {
      valid: true,
      email: resetToken.user.email,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Verify token first
    const verification = await this.verifyResetToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      throw new NotFoundException('Invalid reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          isUsed: true,
        },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }
}
