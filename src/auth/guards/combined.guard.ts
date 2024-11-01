import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class CombinedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const jwtGuard = new (AuthGuard('jwt'))();
      const canActivateJwt = await jwtGuard.canActivate(context);
      if (canActivateJwt) {
        return true;
      }
    } catch (error) {
      try {
        const googleUser = await this.verifyGoogleToken(token);
        request.user = googleUser;
        return true;
      } catch (googleError) {
        throw googleError;
      }
    }
  }

  private async verifyGoogleToken(token: string): Promise<any> {
    const client = jwksClient({
      jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    });

    const decodedHeader = jwt.decode(token, { complete: true }) as any;
    if (!decodedHeader) {
      throw new UnauthorizedException('Invalid token');
    }
    if (!decodedHeader.header) {
      throw new UnauthorizedException('Invalid token');
    }
    const kid = decodedHeader.header.kid;

    const key = await client.getSigningKey(kid);
    const publicKey = key.getPublicKey();

    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  }
}
