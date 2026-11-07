import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../common/auth.guard';
import { db, getDistricts, LOOKUPS, newId, paginate } from '../store/data';

const ownerUploadFields = [
  { name: 'logo', maxCount: 1 },
  { name: 'registrationDocument', maxCount: 1 },
  { name: 'citizenshipFront', maxCount: 1 },
  { name: 'citizenshipBack', maxCount: 1 },
];

const uploadOptions = {
  limits: { files: 4, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: { fieldname: string; mimetype: string; originalname: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
    const extension = file.originalname.toLowerCase().split('.').pop();
    const supported = file.mimetype === 'image/jpeg' && ['jpg', 'jpeg'].includes(extension ?? '')
      || file.mimetype === 'image/png' && extension === 'png'
      || file.mimetype === 'image/webp' && extension === 'webp'
      || file.fieldname === 'registrationDocument' && file.mimetype === 'application/pdf' && extension === 'pdf';
    if (!supported) return cb(new BadRequestException('Choose a supported JPG, PNG, WebP or PDF file'), false);
    cb(null, true);
  },
};

const chequeUploadOptions = {
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: unknown, file: { mimetype: string; originalname: string }, cb: (error: Error | null, acceptFile: boolean) => void) => {
    const extension = file.originalname.toLowerCase().split('.').pop();
    const supported = file.mimetype === 'image/jpeg' && ['jpg', 'jpeg'].includes(extension ?? '')
      || file.mimetype === 'image/png' && extension === 'png'
      || file.mimetype === 'image/webp' && extension === 'webp'
      || file.mimetype === 'application/pdf' && extension === 'pdf';
    if (!supported) return cb(new BadRequestException('Choose a JPG, PNG, WebP or PDF cheque file'), false);
    cb(null, true);
  },
};

function validateOwner(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const pan = typeof body.panNumber === 'string' ? body.panNumber.trim() : '';
  const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
  const contactNumber = typeof body.contactNumber === 'string' ? body.contactNumber.trim() : '';
  if (name.length < 2 || name.length > 150) errors.name = 'Enter a name between 2 and 150 characters';
  const provinceId = typeof body.provinceId === 'string' ? body.provinceId : '';
  const districtId = typeof body.districtId === 'string' ? body.districtId : '';
  if (!LOOKUPS.provinces.some((item) => item.value === provinceId)) errors.provinceId = 'Select a valid state';
  if (!getDistricts(provinceId).some((item) => item.value === districtId)) errors.districtId = 'Select a district in the selected state';
  if (!/^9[678]\d{8}$/.test(phone)) errors.phone = 'Enter a valid 10-digit Nepal mobile number';
  if (body.email !== undefined && typeof body.email !== 'string') errors.email = 'Enter a valid email address';
  else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
  if (body.panNumber !== undefined && typeof body.panNumber !== 'string') errors.panNumber = 'PAN must be 9 digits';
  else if (pan && !/^\d{9}$/.test(pan)) errors.panNumber = 'PAN must be 9 digits';
  if (body.contactEmail !== undefined && typeof body.contactEmail !== 'string') errors.contactEmail = 'Enter a valid email address';
  else if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.contactEmail = 'Enter a valid email address';
  if (body.contactNumber !== undefined && typeof body.contactNumber !== 'string') errors.contactNumber = 'Enter a valid mobile number';
  else if (contactNumber && !/^9[678]\d{8}$/.test(contactNumber)) errors.contactNumber = 'Enter a valid 10-digit Nepal mobile number';
  for (const field of ['localLevel', 'streetAddress', 'contactName', 'registrationNumber']) {
    if (body[field] !== undefined && typeof body[field] !== 'string') errors[field] = 'Enter valid text';
  }
  if (Object.keys(errors).length) throw new UnprocessableEntityException({ message: 'Check the owner details and try again', errors });
}

function ownerLocation(body: Record<string, unknown>) {
  const provinceId = typeof body.provinceId === 'string' ? body.provinceId : '';
  const districtId = typeof body.districtId === 'string' ? body.districtId : '';
  return {
    province: LOOKUPS.provinces.find((item) => item.value === provinceId)?.label ?? '',
    district: getDistricts(provinceId).find((item) => item.value === districtId)?.label ?? '',
  };
}

type OwnerFiles = Record<string, { originalname: string }[]>;

function fileNames(files?: OwnerFiles): Record<string, string> {
  const names: Record<string, string> = {};
  Object.entries(files ?? {}).forEach(([field, values]) => {
    const name = values[0]?.originalname;
    if (name) names[field] = name;
  });
  return names;
}

@Controller('vehicle-owners')
@UseGuards(AuthGuard)
export class VehicleOwnersController {
  @Get()
  list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('q') q?: string,
    @Query('verified') verified?: string,
  ) {
    let items = [...db.vehicleOwners];
    if (verified === 'verified') items = items.filter((o) => o.isVerified);
    if (verified === 'unverified') items = items.filter((o) => !o.isVerified);
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter(
        (o) =>
          String(o.name ?? '').toLowerCase().includes(qq) ||
          String(o.phone ?? '').includes(qq) ||
          (o.email ?? '').toLowerCase().includes(qq),
      );
    }
    const mapped = items.map((o) => ({
      id: o.id,
      name: o.name ?? 'Unknown owner',
      email: o.email,
      address: o.address,
      phone: o.phone ?? '',
      linkedOwner: o.linkedOwner,
      isAssigned: o.isAssigned,
      isVerified: o.isVerified,
    }));
    return paginate(mapped, +page, +pageSize);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const o = db.vehicleOwners.find((x) => x.id === id);
    if (!o) throw new NotFoundException('Owner not found');
    return {
      id: o.id,
      name: o.name,
      email: o.email,
      phone: o.phone,
      linkedOwner: o.linkedOwner,
      isAssigned: o.isAssigned,
      isVerified: o.isVerified,
      form: o.form,
      province: o.province,
      district: o.district,
      address: o.address,
      files: o.files,
    };
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor(ownerUploadFields, uploadOptions))
  create(@Body() body: any, @UploadedFiles() uploads?: OwnerFiles) {
    validateOwner(body);
    const files = fileNames(uploads);
    const form = {
      ...body,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: typeof body.email === 'string' ? body.email.trim() : '',
      isIndividual: body.isIndividual === true || body.isIndividual === 'true',
    };
    const location = ownerLocation(form);
    const o = {
      id: newId(),
      name: form.name,
      email: form.email || null,
      address: form.streetAddress?.trim() ?? '',
      phone: form.phone,
      linkedOwner: null,
      isAssigned: false,
      isVerified: false,
      form,
      ...location,
      files,
      banks: [],
    };
    db.vehicleOwners.push(o);
    return {
      id: o.id,
      name: o.name,
      email: o.email,
      address: o.address,
      phone: o.phone,
      linkedOwner: o.linkedOwner,
      isAssigned: o.isAssigned,
      isVerified: o.isVerified,
    };
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor(ownerUploadFields, uploadOptions))
  update(@Param('id') id: string, @Body() body: any, @UploadedFiles() uploads?: OwnerFiles) {
    const idx = db.vehicleOwners.findIndex((x) => x.id === id);
    if (idx < 0) throw new NotFoundException('Owner not found');
    const o = db.vehicleOwners[idx];
    validateOwner({ ...o.form, ...body });
    Object.assign(o.files, fileNames(uploads));
    Object.assign(o.form, body);
    if (body.isIndividual !== undefined) o.form.isIndividual = body.isIndividual === true || body.isIndividual === 'true';
    if (body.name) o.name = body.name.trim();
    if (body.phone) o.phone = body.phone.trim();
    if (body.email !== undefined) o.email = body.email.trim() || null;
    if (body.streetAddress !== undefined) o.address = body.streetAddress.trim();
    Object.assign(o, ownerLocation(o.form));
    return {
      id: o.id,
      name: o.name,
      email: o.email,
      address: o.address,
      phone: o.phone,
      linkedOwner: o.linkedOwner,
      isAssigned: o.isAssigned,
      isVerified: o.isVerified,
    };
  }

  @Get(':id/banks')
  banks(@Param('id') id: string) {
    const o = db.vehicleOwners.find((x) => x.id === id);
    if (!o) throw new NotFoundException('Owner not found');
    return o.banks;
  }

  @Post(':id/banks')
  @UseInterceptors(FileInterceptor('chequePhoto', chequeUploadOptions))
  addBank(@Param('id') id: string, @Body() body: any, @UploadedFile() chequePhoto?: { mimetype: string; buffer: Buffer }) {
    const o = db.vehicleOwners.find((x) => x.id === id);
    if (!o) throw new NotFoundException('Owner not found');
    const errors: Record<string, string> = {};
    if (!LOOKUPS.banks.some((item) => item.value === body.bankId)) errors.bankId = 'Select a valid bank';
    if (typeof body.branchName !== 'string' || !body.branchName.trim()) errors.branchName = 'Enter the branch name';
    if (typeof body.accountHolder !== 'string' || body.accountHolder.trim().length < 2) errors.accountHolder = 'Enter the account holder name';
    if (typeof body.accountNumber !== 'string' || !/^\d{8,20}$/.test(body.accountNumber.trim())) errors.accountNumber = 'Enter an account number with 8–20 digits';
    if (Object.keys(errors).length) throw new UnprocessableEntityException({ message: 'Check the bank details and try again', errors });

    const isCurrent = body.isCurrent === true || body.isCurrent === 'true';
    if (isCurrent) o.banks.forEach((bank) => { bank.isCurrent = false; });
    const bankName = LOOKUPS.banks.find((item) => item.value === body.bankId)?.label ?? 'Unknown';
    const bank = {
      id: newId(),
      bankId: body.bankId,
      bank: bankName,
      branch: body.branchName.trim(),
      accountHolder: body.accountHolder.trim(),
      accountNumber: body.accountNumber.trim(),
      chequeUrl: chequePhoto ? `data:${chequePhoto.mimetype};base64,${chequePhoto.buffer.toString('base64')}` : null,
      isCurrent,
    };
    o.banks.push(bank);
    return bank;
  }

  @Patch(':id/banks/:bankId')
  @UseInterceptors(FileInterceptor('chequePhoto', chequeUploadOptions))
  updateBank(@Param('id') id: string, @Param('bankId') bankId: string, @Body() body: any, @UploadedFile() chequePhoto?: { mimetype: string; buffer: Buffer }) {
    const o = db.vehicleOwners.find((x) => x.id === id);
    if (!o) throw new NotFoundException('Owner not found');
    const bank = o.banks.find((item) => item.id === bankId);
    if (!bank) throw new NotFoundException('Bank account not found');
    const errors: Record<string, string> = {};
    if (!LOOKUPS.banks.some((item) => item.value === body.bankId)) errors.bankId = 'Select a valid bank';
    if (typeof body.branchName !== 'string' || !body.branchName.trim()) errors.branchName = 'Enter the branch name';
    if (typeof body.accountHolder !== 'string' || body.accountHolder.trim().length < 2) errors.accountHolder = 'Enter the account holder name';
    if (typeof body.accountNumber !== 'string' || !/^\d{8,20}$/.test(body.accountNumber.trim())) errors.accountNumber = 'Enter an account number with 8–20 digits';
    if (Object.keys(errors).length) throw new UnprocessableEntityException({ message: 'Check the bank details and try again', errors });
    const isCurrent = body.isCurrent === true || body.isCurrent === 'true';
    if (isCurrent) o.banks.forEach((item) => { item.isCurrent = false; });
    bank.bankId = body.bankId;
    bank.bank = LOOKUPS.banks.find((item) => item.value === body.bankId)?.label ?? 'Unknown';
    bank.branch = body.branchName.trim();
    bank.accountHolder = body.accountHolder.trim();
    bank.accountNumber = body.accountNumber.trim();
    if (chequePhoto) bank.chequeUrl = `data:${chequePhoto.mimetype};base64,${chequePhoto.buffer.toString('base64')}`;
    bank.isCurrent = isCurrent;
    return bank;
  }

  @Get(':id/vehicles')
  vehicles(@Param('id') id: string) {
    const list = db.vehicles
      .filter((v) => v.ownerId === id)
      .map((v) => ({
        id: v.id,
        vehicleId: v.id,
        name: v.ownerName ?? '',
        type: v.vehicleType,
        plateNo: v.plateNo,
      }));
    return list;
  }
}
