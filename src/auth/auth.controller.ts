import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../store/data';
import { AuthGuard } from '../common/auth.guard';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(
    @Body() body: { email: string; password: string; remember?: boolean },
    @Req() req: Request,
  ) {
    const user = db.users.find((u) => u.email === body.email);
    if (!user || !bcrypt.compareSync(body.password ?? '', user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Store user id in express-session (cookie is set automatically by middleware)
    (req.session as any).userId = user.id;

    // Optional: longer cookie when "remember" is checked
    if (body.remember && req.session.cookie) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    const { passwordHash, ...profile } = user;
    return profile;
  }

  @Post('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return new Promise<void>((resolve) => {
      req.session.destroy(() => {
        res.clearCookie('tqms_sid');
        resolve();
      });
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: any) {
    const { passwordHash, ...profile } = req.user;
    return profile;
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  changePassword(
    @Req() req: any,
    @Body()
    body: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
  ) {
    if (body.newPassword !== body.confirmPassword) {
      throw new UnauthorizedException({
        message: 'Passwords do not match',
        errors: { confirmPassword: 'Must match new password' },
      });
    }
    if (!bcrypt.compareSync(body.currentPassword, req.user.passwordHash)) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
        errors: { currentPassword: 'Incorrect password' },
      });
    }
    req.user.passwordHash = bcrypt.hashSync(body.newPassword, 10);
    return undefined;
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    // Accept always (don't reveal whether email exists)
    return undefined;
  }
}
