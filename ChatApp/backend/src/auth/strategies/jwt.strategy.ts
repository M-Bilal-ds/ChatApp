import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret123',
    });
  }

  async validate(payload: any) {
  const user = await this.authService.validateUserById(payload.sub);
  if (!user) {
    throw new UnauthorizedException();
  }
  return { sub: payload.sub, email: payload.email, ...user }; // Keep the original sub as string
}
}