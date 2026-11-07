import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { db } from '../store/data';

@Controller('narration')
@UseGuards(AuthGuard)
export class NarrationController {
  @Get()
  get() {
    return { narration: db.narration };
  }

  @Patch()
  update(@Body() body: { narration: string }) {
    db.narration = body.narration ?? db.narration;
    return { narration: db.narration };
  }
}
