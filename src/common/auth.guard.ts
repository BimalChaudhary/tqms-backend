import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from '../store/data';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.session?.userId as string | undefined;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = db.users.find((u) => u.id === userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Not authenticated');
    }

    req.user = user;
    return true;
  }
}
