import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';

@Controller('checkpoint')
@UseGuards(AuthGuard)
export class QrController {
  @Get('qr')
  qr() {
    // Payload the mobile/QR flow would scan
    const payload = JSON.stringify({
      type: 'tqms-entry',
      checkpointId: 'cp-ktm-01',
      ts: Date.now(),
    });
    return {
      payload,
      label: 'Kathmandu Checkpoint – Scan to enter queue',
    };
  }
}
