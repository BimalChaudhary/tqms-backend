import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { db, LOOKUPS, paginate } from '../store/data';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  @Get('checkpoint-entries')
  checkpointEntries(
    @Query('name') name?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '1000',
  ) {
    const checkpointUser = db.users[0]?.name ?? 'N/A';
    let items = db.queues.map((q) => ({
      id: q.id,
      sangh: q.sangh ?? db.users[0]?.sthaniyaSangh ?? 'N/A',
      checkpoint: q.lastCheckpoint ?? 'Current Checkpoint',
      user: checkpointUser,
      entryDate: q.entryDate,
      totalVehicles: 1,
      totalAmount: typeof q.cutFee === 'number' ? q.cutFee : 50,
    }));

    if (name) {
      const search = name.trim().toLowerCase();
      items = items.filter((item) =>
        item.checkpoint.toLowerCase().includes(search) ||
        item.user.toLowerCase().includes(search) ||
        item.sangh.toLowerCase().includes(search),
      );
    }
    if (start) items = items.filter((item) => item.entryDate.slice(0, 10) >= start);
    if (end) items = items.filter((item) => item.entryDate.slice(0, 10) <= end);

    return paginate(items, Number(page) || 1, Number(pageSize) || 10);
  }

  @Get('detail-entries')
  detailEntries(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('vehicleNo') vehicleNo?: string,
    @Query('goods') goods?: string,
    @Query('billNo') billNo?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '1000',
  ) {
    let items = db.queues.flatMap((q) =>
      q.entries.map((e: any) => ({
        id: e.id,
        dateTime: e.entryDate ?? q.entryDate,
        receiptNo: e.billNo ?? e.id,
        vehicleNo: q.vehicleNumber,
        vehicleType: q.vehicleType,
        checkpoint: q.lastCheckpoint ?? '—',
        route: `${e.from ?? q.from} → ${e.to ?? q.to}`,
        grossWeight: e.weights?.cp1 ?? q.checkpointWeight ?? 0,
        material: q.loadDetails ?? '—',
        remarks: e.remarks ?? null,
        billNo: e.billNo,
      })),
    );
    if (start) items = items.filter((x) => x.dateTime.slice(0, 10) >= start);
    if (end) items = items.filter((x) => x.dateTime.slice(0, 10) <= end);
    if (vehicleNo) {
      items = items.filter((x) =>
        x.vehicleNo.toLowerCase().includes(vehicleNo.toLowerCase()),
      );
    }
    if (goods) {
      const material = LOOKUPS.goods.find((x) => x.value === goods)?.label ?? goods;
      items = items.filter((x) =>
        x.material.toLowerCase().includes(material.toLowerCase()),
      );
    }
    if (billNo) {
      items = items.filter((x) =>
        (x.billNo ?? '').toLowerCase().includes(billNo.toLowerCase()),
      );
    }
    return paginate(items, +page, +pageSize);
  }
}
