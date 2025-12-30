import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-openidconnect';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const options: StrategyOptions = {
      issuer: configService.get<string>('OIDC_ISSUER'),
      authorizationURL: `${configService.get<string>('OIDC_ISSUER')}authorize`,
      tokenURL: `${configService.get<string>('OIDC_ISSUER')}token`,
      userInfoURL: `${configService.get<string>('OIDC_ISSUER')}userinfo`,
      clientID: configService.get<string>('OIDC_CLIENT_ID'),
      clientSecret: configService.get<string>('OIDC_CLIENT_SECRET'),
      callbackURL: configService.get<string>('OIDC_REDIRECT_URI'),
      scope: ['openid', 'profile', 'email'],
    };

    super(options);
  }

  async validate(
    issuer: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    try {
      const user = await this.authService.validateOidcUser(profile);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
