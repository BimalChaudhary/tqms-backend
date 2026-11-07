import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { db, LOOKUPS, newId, paginate } from '../store/data';

@Controller('other-vehicles')
@UseGuards(AuthGuard)
export class OtherVehiclesController {
  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('kind') kind?: string,
    @Query('q') q?: string,
  ) {
    let items = [...db.otherVehicles];
    if (kind && kind !== 'all') items = items.filter((x) => x.kind === kind);
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter((x) => x.vehicleNumber.toLowerCase().includes(qq));
    }
    const plateTypes = LOOKUPS['plate-types'];
    const vehicleTypes = LOOKUPS['vehicle-types'];
    const rows = items.map((item) => ({
      ...item,
      formattedNo: item.vehicleNumber.trim().toUpperCase(),
      plateType: plateTypes.find((x) => x.value === item.plateTypeId)?.label ?? null,
      vehicleType: vehicleTypes.find((x) => x.value === item.vehicleTypeId)?.label ?? item.vehicleType,
    }));
    return paginate(rows, +page, +pageSize);
  }

  @Post()
  create(@Body() body: any) {
    const row = {
      id: newId(),
      kind: body.kind,
      vehicleNumber: body.vehicleNumber,
      vehicleTypeId: body.vehicleTypeId,
      vehicleType: 'Truck',
      plateTypeId: body.plateTypeId,
    };
    db.otherVehicles.push(row);
    return {
      ...row,
      formattedNo: row.vehicleNumber.trim().toUpperCase(),
      plateType: LOOKUPS['plate-types'].find((x) => x.value === row.plateTypeId)?.label ?? null,
    };
  }
}
