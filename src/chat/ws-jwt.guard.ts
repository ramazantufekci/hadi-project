import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const client =
      context.switchToWs().getClient<Socket>();

    const token =
      this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException(
        'JWT gerekli.',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<{
          sub: string;
        }>(token);

      if (!payload.sub) {
        throw new UnauthorizedException();
      }

      client.data.userId =
        payload.sub;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Geçersiz veya süresi dolmuş token.',
      );
    }
  }

  private extractToken(
    client: Socket,
  ): string | null {
    const authToken =
      client.handshake.auth?.token;

    if (typeof authToken === 'string') {
      return authToken.startsWith('Bearer ')
        ? authToken.substring(7)
        : authToken;
    }

    const header =
      client.handshake.headers
        .authorization;

    if (
      typeof header === 'string' &&
      header.startsWith('Bearer ')
    ) {
      return header.substring(7);
    }

    return null;
  }
}
