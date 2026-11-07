import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard';
import { LOOKUPS, getDistricts, db } from '../store/data';

@Controller('lookup')
@UseGuards(AuthGuard)
export class LookupController {
  @Get(':type')
  lookup(
    @Param('type') type: string,
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
  ) {
    let options: { value: string; label: string }[] = [];

    if (type === 'districts') {
      options = getDistricts(parentId);
    } else if (type === 'vehicles') {
      options = db.vehicles
        .filter((v) => !q || v.vehicleNumber.toLowerCase().includes(q.toLowerCase()) || v.plateNo.toLowerCase().includes(q.toLowerCase()))
        .map((v) => ({ value: v.id, label: v.plateNo }));
    } else if (type === 'vehicle-owners') {
      options = db.vehicleOwners
        .filter((o) => !q || o.name.toLowerCase().includes(q.toLowerCase()))
        .map((o) => ({ value: o.id, label: o.name }));
    } else if (type === 'vehicle-numbers') {
      options = db.vehicles.map((v) => ({ value: v.vehicleNumber, label: v.plateNo }));
    } else if (type === 'bill-numbers') {
      options = [{ value: 'BN-001', label: 'BN-001' }, { value: 'BN-002', label: 'BN-002' }];
    } else {
      options = LOOKUPS[type] ?? [];
    }

    if (q && type !== 'vehicles' && type !== 'vehicle-owners') {
      const qq = q.toLowerCase();
      options = options.filter((o) => o.label.toLowerCase().includes(qq));
    }

    return options;
  }
}
