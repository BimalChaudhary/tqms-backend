import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { db } from '../store/data';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  @Get()
  stats() {
    return {
      inQueue: db.queues.filter((q) => q.status === 'in_queue').length,
      inJob: db.queues.filter((q) => q.status === 'in_job').length,
      pendingApprovals: db.pendingQueues.length,
      paymentPending: db.queues.filter((q) => q.status === 'payment_pending').length,
      todayEntries: db.queues.filter((q) => {
        const d = new Date(q.entryDate);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      }).length,
    };
  }
}
