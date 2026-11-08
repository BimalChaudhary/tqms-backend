import {
  BadRequestException,
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
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../common/auth.guard';
import { db, LOOKUPS, newId, paginate } from '../store/data';
import { CloudinaryStore } from '../store/cloudinary.service';

const SUB_RESOURCES = ['documents', 'owners', 'beneficiaries', 'check-passes', 'route-permits', 'insurances', 'type-cards', 'bluebooks'];

function assertSubResource(resource: string) {
  if (!SUB_RESOURCES.includes(resource)) throw new BadRequestException('Unknown vehicle detail section');
}

function optionLabel(type: string, value: unknown) {
  return typeof value === 'string' ? LOOKUPS[type]?.find((option) => option.value === value)?.label ?? null : null;
}

function decorateSubRecord(resource: string, values: Record<string, any>) {
  const row = { ...values };
  if (resource === 'documents') row.documentTypeIdLabel = optionLabel('document-types', row.documentTypeId);
  if (resource === 'owners') {
    const owner = db.vehicleOwners.find((item) => item.id === row.ownerId);
    row.ownerIdLabel = owner?.name ?? null;
    row.ownerType = owner?.form?.isIndividual ? 'Individual' : owner ? 'Company' : null;
    row.linkedOwner = owner?.linkedOwner ?? null;
  }
  if (resource === 'insurances') {
    row.companyIdLabel = optionLabel('insurance-companies', row.companyId);
    row.policyTypeIdLabel = optionLabel('policy-types', row.policyTypeId);
  }
  if (resource === 'type-cards') {
    row.cardTypeIdLabel = optionLabel('card-types', row.cardTypeId);
    row.sanghIdLabel = optionLabel('sanghs', row.sanghId);
  }
  return row;
}

function isValidDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateSubRecord(resource: string, values: Record<string, any>) {
  const errors: Record<string, string> = {};
  const requiredText = (field: string, message: string) => {
    if (typeof values[field] !== 'string' || !values[field].trim()) errors[field] = message;
  };
  const dateRange = (start: string, end: string) => {
    if (!isValidDate(values[start])) errors[start] = 'Enter a valid date';
    if (!isValidDate(values[end])) errors[end] = 'Enter a valid date';
    else if (isValidDate(values[start]) && values[end] < values[start]) errors[end] = 'End date must be on or after start date';
  };

  if (resource === 'documents') {
    requiredText('name', 'Enter a document name');
    if (!LOOKUPS['document-types'].some((item) => item.value === values.documentTypeId)) errors.documentTypeId = 'Select a document type';
    if (!values.documentUrl) errors.document = 'Upload the document';
  } else if (resource === 'owners') {
    if (!db.vehicleOwners.some((item) => item.id === values.ownerId)) errors.ownerId = 'Select a valid vehicle owner';
  } else if (resource === 'beneficiaries') {
    requiredText('name', 'Enter the beneficiary name');
    const contact = typeof values.contact === 'string' ? values.contact.trim() : '';
    if (!/^9[678]\d{8}$/.test(contact)) errors.contact = 'Enter a valid 10-digit Nepal mobile number';
  } else if (resource === 'check-passes' || resource === 'route-permits') {
    dateRange('from', 'to');
    if (resource === 'route-permits' && !values.documentUrl) errors.document = 'Upload the route permit';
  } else if (resource === 'insurances') {
    if (!LOOKUPS['insurance-companies'].some((item) => item.value === values.companyId)) errors.companyId = 'Select an insurance company';
    requiredText('policyNumber', 'Enter the policy number');
    if (!LOOKUPS['policy-types'].some((item) => item.value === values.policyTypeId)) errors.policyTypeId = 'Select a policy type';
    dateRange('startDate', 'expiryDate');
  } else if (resource === 'type-cards') {
    if (!LOOKUPS['card-types'].some((item) => item.value === values.cardTypeId)) errors.cardTypeId = 'Select a card type';
    if (!LOOKUPS.sanghs.some((item) => item.value === values.sanghId)) errors.sanghId = 'Select a sthaniya sangh';
    dateRange('startDate', 'expiryDate');
    requiredText('narration', 'Enter the narration');
  } else if (resource === 'bluebooks') {
    dateRange('registrationDate', 'expiryDate');
  }
  if (Object.keys(errors).length) throw new UnprocessableEntityException({ message: 'Check the record details and try again', errors });
}

const documentUploadOptions = {
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: { mimetype: string; originalname: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
    const extension = file.originalname.toLowerCase().split('.').pop();
    const supported = file.mimetype === 'image/jpeg' && ['jpg', 'jpeg'].includes(extension ?? '')
      || file.mimetype === 'image/png' && extension === 'png'
      || file.mimetype === 'image/webp' && extension === 'webp'
      || file.mimetype === 'application/pdf' && extension === 'pdf';
    if (!supported) return cb(new BadRequestException('Choose a JPG, PNG, WebP or PDF document'), false);
    cb(null, true);
  },
};

type DocumentUploads = { document?: { originalname: string; mimetype: string; buffer: Buffer }[] };

async function withDocument(values: Record<string, any>, uploads: DocumentUploads | undefined, cloudinary: CloudinaryStore, resource: string) {
  const file = uploads?.document?.[0];
  if (!file) return values;
  const asset = await cloudinary.upload(file.buffer, file.originalname, `tqms/vehicles/${resource}`);
  return {
    ...values,
    documentName: file.originalname,
    documentUrl: asset.url,
    documentPublicId: asset.publicId,
    documentResourceType: asset.resourceType,
  };
}

function lookupCode(type: string, id: string) {
  const label = optionLabel(type, id) ?? '';
  return label.match(/^\(([^)]+)\)/)?.[1] ?? label.match(/\(([^)]+)\)$/)?.[1] ?? label;
}

function formatPlate(body: Record<string, any>) {
  if (body.plateType === 'embossed') return String(body.embossedNumber ?? '').trim();
  const symbol = lookupCode('symbols', body.symbolId);
  const suffix = [body.lotNo, symbol, body.vehicleNumber].filter(Boolean);
  if (body.plateType === 'zonal') return [lookupCode('zonal-codes', body.zonalCodeId), ...suffix].filter(Boolean).join('-');
  const provinceCode = lookupCode('provinces', body.provinceId).replace(/\D/g, '');
  return [`Province-${provinceCode}`, ...suffix].filter(Boolean).join('-');
}

function validateVehicle(body: Record<string, any>) {
  const errors: Record<string, string> = {};
  if (!LOOKUPS.sanghs.some((item) => item.value === body.sanghId)) errors.sanghId = 'Select a valid sthaniya sangh';
  if (!db.vehicleOwners.some((item) => item.id === body.ownerId)) errors.ownerId = 'Select a valid vehicle owner';
  if (!LOOKUPS['vehicle-types'].some((item) => item.value === body.vehicleTypeId)) errors.vehicleTypeId = 'Select a valid vehicle type';
  if (!LOOKUPS['plate-colors'].some((item) => item.value === body.plateColorId)) errors.plateColorId = 'Select a plate colour';
  if (!['embossed', 'provincial', 'zonal'].includes(body.plateType)) errors.plateType = 'Select a valid plate type';
  if (body.plateType === 'zonal' && !LOOKUPS['zonal-codes'].some((item) => item.value === body.zonalCodeId)) errors.zonalCodeId = 'Select a zonal code';
  if (body.plateType === 'provincial' && !LOOKUPS.provinces.some((item) => item.value === body.provinceId)) errors.provinceId = 'Select a state';
  if (['provincial', 'zonal'].includes(body.plateType)) {
    if (!LOOKUPS.symbols.some((item) => item.value === body.symbolId)) errors.symbolId = 'Select a vehicle symbol';
    if (typeof body.lotNo !== 'string' || !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(body.lotNo.trim())) errors.lotNo = 'Enter a valid lot number';
    if (typeof body.vehicleNumber !== 'string' || !/^\d{1,4}$/.test(body.vehicleNumber.trim())) errors.vehicleNumber = 'Enter a 1–4 digit vehicle number';
  }
  if (body.plateType === 'embossed' && (typeof body.embossedNumber !== 'string' || !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(body.embossedNumber.trim())))
    errors.embossedNumber = 'Enter a valid embossed plate number';
  if (Object.keys(errors).length) throw new UnprocessableEntityException({ message: 'Check the vehicle details and try again', errors });
}

function addVehicleAudit(vehicle: (typeof db.vehicles)[number], action: string, detail: string) {
  vehicle.auditLogs.unshift({ id: newId(), at: new Date().toISOString(), user: 'System', action, detail });
}

function syncInsuranceSummary(vehicle: (typeof db.vehicles)[number]) {
  const latest = [...(vehicle.sub.insurances ?? [])].sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))[0];
  vehicle.general.insuranceCompany = latest?.companyIdLabel ?? null;
  vehicle.general.policyType = latest?.policyTypeIdLabel ?? null;
  vehicle.general.policyNumber = latest?.policyNumber ?? null;
  vehicle.general.policyExpiry = latest?.expiryDate ?? null;
}

@Controller('vehicles')
@UseGuards(AuthGuard)
export class VehiclesController {
  constructor(private readonly cloudinary: CloudinaryStore) {}

  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('q') q?: string,
  ) {
    let items = db.vehicles.map((v) => ({
      id: v.id,
      plateNo: v.plateNo,
      lotNo: v.lotNo,
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
    }));
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter(
        (v) =>
          v.plateNo.toLowerCase().includes(qq) ||
          v.vehicleNumber.toLowerCase().includes(qq),
      );
    }
    return paginate(items, +page, +pageSize);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    return {
      id: v.id,
      plateNo: v.plateNo,
      sanghName: v.sanghName,
      mobile: v.mobile,
      email: v.email,
      general: v.general,
      form: v.form,
      labels: { sangh: v.sanghName ?? '', owner: v.ownerName ?? '' },
    };
  }

  @Post()
  create(@Body() body: any) {
    validateVehicle(body);
    const plateNo = formatPlate(body);
    if (db.vehicles.some((v) => v.plateNo.toLowerCase() === plateNo.toLowerCase())) {
      throw new UnprocessableEntityException({
        message: 'Validation failed',
        errors: { vehicleNumber: 'Vehicle number already exists' },
      });
    }
    const owner = db.vehicleOwners.find((o) => o.id === body.ownerId);
    const vehicleType = optionLabel('vehicle-types', body.vehicleTypeId) ?? 'Unknown';
    const sanghName = optionLabel('sanghs', body.sanghId);

    const v = {
      id: newId(),
      plateNo,
      lotNo: body.lotNo ?? null,
      vehicleNumber: body.plateType === 'embossed' ? plateNo.replace(/\s/g, '') : String(body.vehicleNumber ?? ''),
      vehicleTypeId: body.vehicleTypeId,
      vehicleType,
      sanghId: body.sanghId,
      sanghName,
      ownerId: body.ownerId,
      ownerName: owner?.name ?? null,
      mobile: owner?.phone ?? null,
      email: owner?.email ?? null,
      form: { ...body },
      general: {
        engineNumber: body.engineNumber,
        chassisNumber: body.chassisNumber,
        registrationDate: new Date().toISOString().slice(0, 10),
        modelNo: body.modelNo,
        plateType: body.plateType === 'embossed' ? 'Embossed' : body.plateType === 'provincial' ? 'Provincial' : 'Zonal',
        companyName: body.companyName,
        tyres: null,
        ownerName: owner?.name ?? null,
        plateNo,
        category: null,
        vehicleType,
        capacityTons: null,
        insuranceCompany: null,
        policyType: null,
        policyNumber: null,
        policyExpiry: null,
      },
      tareWeight: 0,
      sub: {
        documents: [],
        owners: [],
        beneficiaries: [],
        'check-passes': [],
        'route-permits': [],
        insurances: [],
        'type-cards': [],
        bluebooks: [],
      },
      auditLogs: [
        {
          id: newId(),
          at: new Date().toISOString(),
          user: 'System',
          action: 'Created',
          detail: 'Vehicle created',
        },
      ],
    };
    db.vehicles.push(v);
    return {
      id: v.id,
      plateNo: v.plateNo,
      lotNo: v.lotNo,
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const idx = db.vehicles.findIndex((x) => x.id === id);
    if (idx < 0) throw new NotFoundException('Vehicle not found');
    const v = db.vehicles[idx];
    validateVehicle(body);
    const plateNo = formatPlate(body);
    if (db.vehicles.some((item) => item.id !== id && item.plateNo.toLowerCase() === plateNo.toLowerCase())) {
      throw new UnprocessableEntityException({ message: 'Validation failed', errors: { vehicleNumber: 'Vehicle number already exists' } });
    }
    Object.assign(v.form, body);
    const owner = db.vehicleOwners.find((item) => item.id === body.ownerId);
    const vehicleType = optionLabel('vehicle-types', body.vehicleTypeId) ?? 'Unknown';
    v.plateNo = plateNo;
    v.vehicleNumber = body.plateType === 'embossed' ? plateNo.replace(/\s/g, '') : String(body.vehicleNumber ?? '');
    v.lotNo = body.lotNo || null;
    v.vehicleTypeId = body.vehicleTypeId;
    v.vehicleType = vehicleType;
    v.sanghId = body.sanghId;
    v.sanghName = optionLabel('sanghs', body.sanghId);
    v.ownerId = body.ownerId;
    v.ownerName = owner?.name ?? null;
    v.mobile = owner?.phone ?? null;
    v.email = owner?.email ?? null;
    Object.assign(v.general, {
      engineNumber: body.engineNumber || null,
      chassisNumber: body.chassisNumber || null,
      modelNo: body.modelNo || null,
      companyName: body.companyName || null,
      plateType: body.plateType === 'embossed' ? 'Embossed' : body.plateType === 'provincial' ? 'Provincial' : 'Zonal',
      plateNo,
      vehicleType,
      ownerName: owner?.name ?? null,
    });
    v.auditLogs.unshift({
      id: newId(),
      at: new Date().toISOString(),
      user: 'System',
      action: 'Updated',
      detail: 'Vehicle details and registration plate updated',
    });
    return {
      id: v.id,
      plateNo: v.plateNo,
      lotNo: v.lotNo,
      vehicleNumber: v.vehicleNumber,
      vehicleType: v.vehicleType,
    };
  }

  @Get(':id/audit-logs')
  auditLogs(@Param('id') id: string) {
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    return v.auditLogs;
  }

  @Get(':id/tare-weight')
  getTare(@Param('id') id: string) {
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    return { tareWeight: v.tareWeight };
  }

  @Patch(':id/tare-weight')
  setTare(@Param('id') id: string, @Body() body: { tareWeight: number }) {
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    if (typeof body.tareWeight !== 'number' || !Number.isFinite(body.tareWeight) || body.tareWeight < 1 || body.tareWeight > 100000) {
      throw new UnprocessableEntityException({ message: 'Enter a tare weight between 1 and 100,000 kg', errors: { tareWeight: 'Enter a tare weight between 1 and 100,000 kg' } });
    }
    v.tareWeight = body.tareWeight;
    addVehicleAudit(v, 'Updated', 'Tare weight updated');
    return { tareWeight: v.tareWeight };
  }

  // Generic sub-resources
  @Get(':id/:resource')
  subList(@Param('id') id: string, @Param('resource') resource: string) {
    assertSubResource(resource);
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    return (v.sub[resource] ?? []).map((row: Record<string, any>) => decorateSubRecord(resource, row));
  }

  @Post(':id/:resource')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }], documentUploadOptions))
  async subCreate(
    @Param('id') id: string,
    @Param('resource') resource: string,
    @Body() body: any,
    @UploadedFiles() uploads?: DocumentUploads,
  ) {
    assertSubResource(resource);
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    if (!v.sub[resource]) v.sub[resource] = [];
    const values = await withDocument(body, uploads, this.cloudinary, resource);
    validateSubRecord(resource, values);
    const row = decorateSubRecord(resource, { id: newId(), ...values });
    v.sub[resource].push(row);
    if (resource === 'insurances') syncInsuranceSummary(v);
    addVehicleAudit(v, 'Added', `${resource} record added`);
    return row;
  }

  @Patch(':id/:resource/:rid')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }], documentUploadOptions))
  async subUpdate(
    @Param('id') id: string,
    @Param('resource') resource: string,
    @Param('rid') rid: string,
    @Body() body: any,
    @UploadedFiles() uploads?: DocumentUploads,
  ) {
    assertSubResource(resource);
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    const list = v.sub[resource] ?? [];
    const idx = list.findIndex((r: any) => r.id === rid);
    if (idx < 0) throw new NotFoundException('Record not found');
    const values = await withDocument({ ...list[idx], ...body }, uploads, this.cloudinary, resource);
    validateSubRecord(resource, values);
    list[idx] = decorateSubRecord(resource, { ...values, id: rid });
    if (resource === 'insurances') syncInsuranceSummary(v);
    addVehicleAudit(v, 'Updated', `${resource} record updated`);
    return list[idx];
  }

  @Delete(':id/:resource/:rid')
  subRemove(
    @Param('id') id: string,
    @Param('resource') resource: string,
    @Param('rid') rid: string,
  ) {
    assertSubResource(resource);
    const v = db.vehicles.find((x) => x.id === id);
    if (!v) throw new NotFoundException('Vehicle not found');
    const list = v.sub[resource] ?? [];
    const idx = list.findIndex((r: any) => r.id === rid);
    if (idx < 0) throw new NotFoundException('Record not found');
    list.splice(idx, 1);
    if (resource === 'insurances') syncInsuranceSummary(v);
    addVehicleAudit(v, 'Deleted', `${resource} record deleted`);
    return undefined;
  }
}
