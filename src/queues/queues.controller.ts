import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { db, newId, paginate } from '../store/data';

@Controller('queues')
@UseGuards(AuthGuard)
export class QueuesController {
  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('status') status?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('cardType') cardType?: string,
    @Query('vehicleType') vehicleType?: string,
    @Query('q') q?: string,
  ) {
    let items = [...db.queues];
    if (status && status !== 'all') items = items.filter((x) => x.status === status);
    if (vehicleId) items = items.filter((x) => x.vehicleId === vehicleId);
    if (cardType) items = items.filter((x) => x.cardType === cardType);
    if (vehicleType) items = items.filter((x) => x.vehicleType === vehicleType);
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter(
        (x) =>
          x.vehicleNumber.toLowerCase().includes(qq) ||
          x.queueNumber.toLowerCase().includes(qq),
      );
    }
    const mapped = items.map((q) => ({
      id: q.id,
      queueNumber: q.queueNumber,
      vehicleNumber: q.vehicleNumber,
      vehicleType: q.vehicleType,
      cardType: q.cardType,
      lastCheckpoint: q.lastCheckpoint,
      status: q.status,
    }));
    return paginate(mapped, +page, +pageSize);
  }

  @Get('pending')
  pending() {
    return db.pendingQueues.map((p) => ({
      id: p.id,
      vehicleNumber: p.vehicleNumber,
      route: p.route,
      entryDate: p.entryDate,
    }));
  }

  @Get('pending/:id')
  pendingGet(@Param('id') id: string) {
    const p = db.pendingQueues.find((x) => x.id === id);
    if (!p) throw new NotFoundException('Pending queue not found');
    return p;
  }

  @Post('pending/:id/approve')
  pendingApprove(@Param('id') id: string, @Body() body: any) {
    const idx = db.pendingQueues.findIndex((x) => x.id === id);
    if (idx < 0) throw new NotFoundException('Pending queue not found');
    const pending = db.pendingQueues[idx];
    db.pendingQueues.splice(idx, 1);

    let vehicleNumber = pending.vehicleNumber;
    let vehicleType = 'Unknown';
    let owner: string | null = null;
    let isRegistered = false;
    let sangh: string | null = null;

    if (body.matchedVehicleId) {
      const v = db.vehicles.find((x) => x.id === body.matchedVehicleId);
      if (v) {
        vehicleNumber = v.plateNo;
        vehicleType = v.vehicleType;
        owner = v.ownerName;
        isRegistered = true;
        sangh = v.sanghName;
      }
    }

    const queue = {
      id: newId(),
      queueNumber: `Q-${Date.now()}`,
      vehicleNumber,
      vehicleId: body.matchedVehicleId,
      vehicleType,
      cardType: null,
      cardNumber: null,
      lastCheckpoint: 'Current Checkpoint',
      status: 'in_queue' as const,
      owner,
      isRegistered,
      sangh,
      route: `${body.from} → ${body.to}`,
      transportCompany: null,
      driverPhone: pending.driverPhone,
      cutFee: 50,
      loadDetails: body.material,
      checkpointWeight: body.grossWeight,
      entryDate: new Date().toISOString(),
      from: body.from,
      to: body.to,
      kind: isRegistered ? 'registered' : 'unregistered',
      entries: [
        {
          id: newId(),
          entryDate: new Date().toISOString(),
          from: body.from,
          to: body.to,
          weights: { cp1: body.grossWeight, cp2: null, cp3: null },
          billNo: null,
        },
      ],
    };
    db.queues.unshift(queue);
    return queue;
  }

  @Delete('pending/:id')
  pendingRemove(@Param('id') id: string) {
    const idx = db.pendingQueues.findIndex((x) => x.id === id);
    if (idx < 0) throw new NotFoundException('Pending queue not found');
    db.pendingQueues.splice(idx, 1);
    return undefined;
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const q = db.queues.find((x) => x.id === id);
    if (!q) throw new NotFoundException('Queue not found');
    return q;
  }

  @Post()
  create(@Body() body: any) {
    let vehicleNumber = body.vehicleNumber ?? 'UNKNOWN';
    let vehicleType = 'Unknown';
    let owner: string | null = null;
    let isRegistered = body.kind === 'registered';
    let sangh: string | null = null;
    let vehicleId = body.vehicleId;

    if (body.vehicleId) {
      const v = db.vehicles.find((x) => x.id === body.vehicleId);
      if (v) {
        vehicleNumber = v.plateNo;
        vehicleType = v.vehicleType;
        owner = v.ownerName;
        sangh = v.sanghName;
        isRegistered = true;
      }
    } else if (body.vehicleTypeId) {
      const vt = db.vehicles; // fallback
      vehicleType = 'Truck'; // simplified
    }

    const queue = {
      id: newId(),
      queueNumber: `Q-${Date.now()}`,
      vehicleNumber,
      vehicleId,
      vehicleType,
      cardType: null,
      cardNumber: null,
      lastCheckpoint: 'Current Checkpoint',
      status: 'in_queue' as const,
      owner,
      isRegistered,
      sangh,
      route: `${body.from} → ${body.to}`,
      transportCompany: body.transportCompany ?? null,
      driverPhone: body.driverPhone ?? null,
      cutFee: [0, 50, 100].includes(Number(body.cutFee)) ? Number(body.cutFee) : 50,
      loadDetails: body.loadDetails,
      checkpointWeight: body.grossWeight,
      entryDate: new Date().toISOString(),
      from: body.from,
      to: body.to,
      kind: body.kind,
      entries: [
        {
          id: newId(),
          entryDate: new Date().toISOString(),
          from: body.from,
          to: body.to,
          weights: { cp1: body.grossWeight, cp2: null, cp3: null },
          billNo: null,
        },
      ],
    };
    db.queues.unshift(queue);
    return queue;
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @Body() body: { grossWeight: number }) {
    const q = db.queues.find((x) => x.id === id);
    if (!q) throw new NotFoundException('Queue not found');
    q.status = 'in_job';
    q.checkpointWeight = body.grossWeight;
    if (q.entries[0]) q.entries[0].weights.cp1 = body.grossWeight;
    return q;
  }

  @Post(':id/end-journey')
  endJourney(@Param('id') id: string) {
    const q = db.queues.find((x) => x.id === id);
    if (!q) throw new NotFoundException('Queue not found');
    q.status = 'payment_pending';
    return q;
  }

  @Get(':id/receipt')
  receipt(@Param('id') id: string) {
    const q = db.queues.find((x) => x.id === id);
    if (!q) throw new NotFoundException('Queue not found');
    const now = new Date();
    return {
      receiptNo: `RCPT-${q.queueNumber}`,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 8),
      sangh: q.sangh ?? 'N/A',
      checkpoint: 'Current Checkpoint',
      vehicleNumber: q.vehicleNumber,
      load: q.loadDetails,
      driverPhone: q.driverPhone ?? null,
      narration: db.narration,
      weight: q.checkpointWeight,
      charges: [{ label: 'काटा शुल्क', amount: q.cutFee ?? 50 }],
      total: q.cutFee ?? 50,
    };
  }
}
