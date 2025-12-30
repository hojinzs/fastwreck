import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider } from 'prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    };
  }
}
