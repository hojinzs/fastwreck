import { Controller, Post, Body, UseGuards, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { OidcAuthGuard } from './guards/oidc-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from 'prisma/client';
import { ConfigService } from '@nestjs/config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @CurrentUser() user: User) {
    return this.authService.login(user);
  }

  @Get('oidc')
  @UseGuards(OidcAuthGuard)
  @ApiOperation({ summary: 'Initiate OIDC authentication flow' })
  @ApiResponse({ status: 302, description: 'Redirects to OIDC provider' })
  async oidcLogin() {
    // Initiates OIDC flow
  }

  @Get('oidc/callback')
  @UseGuards(OidcAuthGuard)
  @ApiOperation({ summary: 'OIDC callback endpoint' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  async oidcCallback(@CurrentUser() user: User, @Res() res: any) {
    const token = await this.authService.login(user);

    // Redirect to frontend with token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(`${frontendUrl}/auth/callback?token=${token.access_token}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      provider: user.provider,
    };
  }
}
