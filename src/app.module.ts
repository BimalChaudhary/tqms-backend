import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { LookupController } from './lookup/lookup.controller';
import { CheckpointUsersController } from './checkpoint-users/checkpoint-users.controller';
import { NarrationController } from './narration/narration.controller';
import { QueuesController } from './queues/queues.controller';
import { VehiclesController } from './vehicles/vehicles.controller';
import { VehicleOwnersController } from './vehicle-owners/vehicle-owners.controller';
import { OtherVehiclesController } from './other-vehicles/other-vehicles.controller';
import { ReportsController } from './reports/reports.controller';
import { QrController } from './qr/qr.controller';

@Module({
  imports: [],
  controllers: [
    AuthController,
    DashboardController,
    LookupController,
    CheckpointUsersController,
    NarrationController,
    QueuesController,
    VehiclesController,
    VehicleOwnersController,
    OtherVehiclesController,
    ReportsController,
    QrController,
  ],
  providers: [],
})
export class AppModule {}
