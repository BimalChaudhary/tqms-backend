import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { db, newId, paginate } from '../store/data';

@Controller('checkpoint-users')
@UseGuards(AuthGuard)
export class CheckpointUsersController {
  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('q') q?: string,
  ) {
    let items = [...db.checkpointUsers];
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter(
        (u) =>
          u.name.toLowerCase().includes(qq) ||
          u.contact.includes(qq) ||
          (u.address ?? '').toLowerCase().includes(qq) ||
          u.email.toLowerCase().includes(qq),
      );
    }
    return paginate(items, +page, +pageSize);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const u = db.checkpointUsers.find((x) => x.id === id);
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  @Post()
  create(@Body() body: any) {
    if (db.checkpointUsers.some((u) => u.email === body.email)) {
      throw new UnprocessableEntityException({
        message: 'Validation failed',
        errors: { email: 'Email already in use' },
      });
    }
    const user = {
      id: newId(),
      name: body.name,
      address: body.address ?? null,
      contact: body.contact,
      email: body.email,
      provinceId: body.provinceId,
      districtId: body.districtId,
      isActive: body.isActive ?? true,
    };
    db.checkpointUsers.push(user);
    return user;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const idx = db.checkpointUsers.findIndex((x) => x.id === id);
    if (idx < 0) throw new NotFoundException('User not found');
    if (body.email && body.email !== db.checkpointUsers[idx].email) {
      if (db.checkpointUsers.some((u) => u.email === body.email)) {
        throw new UnprocessableEntityException({
          message: 'Validation failed',
          errors: { email: 'Email already in use' },
        });
      }
    }
    db.checkpointUsers[idx] = { ...db.checkpointUsers[idx], ...body, id };
    return db.checkpointUsers[idx];
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    const idx = db.checkpointUsers.findIndex((x) => x.id === id);
    if (idx < 0) throw new NotFoundException('User not found');
    db.checkpointUsers[idx].isActive = !!body.isActive;
    return db.checkpointUsers[idx];
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const idx = db.checkpointUsers.findIndex((x) => x.id === id);
    if (idx < 0) throw new NotFoundException('User not found');
    db.checkpointUsers.splice(idx, 1);
    return undefined;
  }
}
