"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleOwnersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
const ownerUploadFields = [
    { name: 'logo', maxCount: 1 },
    { name: 'registrationDocument', maxCount: 1 },
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
];
const uploadOptions = {
    limits: { files: 4, fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const extension = file.originalname.toLowerCase().split('.').pop();
        const supported = file.mimetype === 'image/jpeg' && ['jpg', 'jpeg'].includes(extension ?? '')
            || file.mimetype === 'image/png' && extension === 'png'
            || file.mimetype === 'image/webp' && extension === 'webp'
            || file.fieldname === 'registrationDocument' && file.mimetype === 'application/pdf' && extension === 'pdf';
        if (!supported)
            return cb(new common_1.BadRequestException('Choose a supported JPG, PNG, WebP or PDF file'), false);
        cb(null, true);
    },
};
const chequeUploadOptions = {
    limits: { files: 1, fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const extension = file.originalname.toLowerCase().split('.').pop();
        const supported = file.mimetype === 'image/jpeg' && ['jpg', 'jpeg'].includes(extension ?? '')
            || file.mimetype === 'image/png' && extension === 'png'
            || file.mimetype === 'image/webp' && extension === 'webp'
            || file.mimetype === 'application/pdf' && extension === 'pdf';
        if (!supported)
            return cb(new common_1.BadRequestException('Choose a JPG, PNG, WebP or PDF cheque file'), false);
        cb(null, true);
    },
};
function validateOwner(body) {
    const errors = {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const pan = typeof body.panNumber === 'string' ? body.panNumber.trim() : '';
    const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
    const contactNumber = typeof body.contactNumber === 'string' ? body.contactNumber.trim() : '';
    if (name.length < 2 || name.length > 150)
        errors.name = 'Enter a name between 2 and 150 characters';
    const provinceId = typeof body.provinceId === 'string' ? body.provinceId : '';
    const districtId = typeof body.districtId === 'string' ? body.districtId : '';
    if (!data_1.LOOKUPS.provinces.some((item) => item.value === provinceId))
        errors.provinceId = 'Select a valid state';
    if (!(0, data_1.getDistricts)(provinceId).some((item) => item.value === districtId))
        errors.districtId = 'Select a district in the selected state';
    if (!/^9[678]\d{8}$/.test(phone))
        errors.phone = 'Enter a valid 10-digit Nepal mobile number';
    if (body.email !== undefined && typeof body.email !== 'string')
        errors.email = 'Enter a valid email address';
    else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        errors.email = 'Enter a valid email address';
    if (body.panNumber !== undefined && typeof body.panNumber !== 'string')
        errors.panNumber = 'PAN must be 9 digits';
    else if (pan && !/^\d{9}$/.test(pan))
        errors.panNumber = 'PAN must be 9 digits';
    if (body.contactEmail !== undefined && typeof body.contactEmail !== 'string')
        errors.contactEmail = 'Enter a valid email address';
    else if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
        errors.contactEmail = 'Enter a valid email address';
    if (body.contactNumber !== undefined && typeof body.contactNumber !== 'string')
        errors.contactNumber = 'Enter a valid mobile number';
    else if (contactNumber && !/^9[678]\d{8}$/.test(contactNumber))
        errors.contactNumber = 'Enter a valid 10-digit Nepal mobile number';
    for (const field of ['localLevel', 'streetAddress', 'contactName', 'registrationNumber']) {
        if (body[field] !== undefined && typeof body[field] !== 'string')
            errors[field] = 'Enter valid text';
    }
    if (Object.keys(errors).length)
        throw new common_1.UnprocessableEntityException({ message: 'Check the owner details and try again', errors });
}
function ownerLocation(body) {
    const provinceId = typeof body.provinceId === 'string' ? body.provinceId : '';
    const districtId = typeof body.districtId === 'string' ? body.districtId : '';
    return {
        province: data_1.LOOKUPS.provinces.find((item) => item.value === provinceId)?.label ?? '',
        district: (0, data_1.getDistricts)(provinceId).find((item) => item.value === districtId)?.label ?? '',
    };
}
function fileNames(files) {
    const names = {};
    Object.entries(files ?? {}).forEach(([field, values]) => {
        const name = values[0]?.originalname;
        if (name)
            names[field] = name;
    });
    return names;
}
let VehicleOwnersController = class VehicleOwnersController {
    list(page = '1', pageSize = '10', q, verified) {
        let items = [...data_1.db.vehicleOwners];
        if (verified === 'verified')
            items = items.filter((o) => o.isVerified);
        if (verified === 'unverified')
            items = items.filter((o) => !o.isVerified);
        if (q) {
            const qq = q.toLowerCase();
            items = items.filter((o) => String(o.name ?? '').toLowerCase().includes(qq) ||
                String(o.phone ?? '').includes(qq) ||
                (o.email ?? '').toLowerCase().includes(qq));
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
        return (0, data_1.paginate)(mapped, +page, +pageSize);
    }
    get(id) {
        const o = data_1.db.vehicleOwners.find((x) => x.id === id);
        if (!o)
            throw new common_1.NotFoundException('Owner not found');
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
    create(body, uploads) {
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
            id: (0, data_1.newId)(),
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
        data_1.db.vehicleOwners.push(o);
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
    update(id, body, uploads) {
        const idx = data_1.db.vehicleOwners.findIndex((x) => x.id === id);
        if (idx < 0)
            throw new common_1.NotFoundException('Owner not found');
        const o = data_1.db.vehicleOwners[idx];
        validateOwner({ ...o.form, ...body });
        Object.assign(o.files, fileNames(uploads));
        Object.assign(o.form, body);
        if (body.isIndividual !== undefined)
            o.form.isIndividual = body.isIndividual === true || body.isIndividual === 'true';
        if (body.name)
            o.name = body.name.trim();
        if (body.phone)
            o.phone = body.phone.trim();
        if (body.email !== undefined)
            o.email = body.email.trim() || null;
        if (body.streetAddress !== undefined)
            o.address = body.streetAddress.trim();
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
    banks(id) {
        const o = data_1.db.vehicleOwners.find((x) => x.id === id);
        if (!o)
            throw new common_1.NotFoundException('Owner not found');
        return o.banks;
    }
    addBank(id, body, chequePhoto) {
        const o = data_1.db.vehicleOwners.find((x) => x.id === id);
        if (!o)
            throw new common_1.NotFoundException('Owner not found');
        const errors = {};
        if (!data_1.LOOKUPS.banks.some((item) => item.value === body.bankId))
            errors.bankId = 'Select a valid bank';
        if (typeof body.branchName !== 'string' || !body.branchName.trim())
            errors.branchName = 'Enter the branch name';
        if (typeof body.accountHolder !== 'string' || body.accountHolder.trim().length < 2)
            errors.accountHolder = 'Enter the account holder name';
        if (typeof body.accountNumber !== 'string' || !/^\d{8,20}$/.test(body.accountNumber.trim()))
            errors.accountNumber = 'Enter an account number with 8–20 digits';
        if (Object.keys(errors).length)
            throw new common_1.UnprocessableEntityException({ message: 'Check the bank details and try again', errors });
        const isCurrent = body.isCurrent === true || body.isCurrent === 'true';
        if (isCurrent)
            o.banks.forEach((bank) => { bank.isCurrent = false; });
        const bankName = data_1.LOOKUPS.banks.find((item) => item.value === body.bankId)?.label ?? 'Unknown';
        const bank = {
            id: (0, data_1.newId)(),
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
    updateBank(id, bankId, body, chequePhoto) {
        const o = data_1.db.vehicleOwners.find((x) => x.id === id);
        if (!o)
            throw new common_1.NotFoundException('Owner not found');
        const bank = o.banks.find((item) => item.id === bankId);
        if (!bank)
            throw new common_1.NotFoundException('Bank account not found');
        const errors = {};
        if (!data_1.LOOKUPS.banks.some((item) => item.value === body.bankId))
            errors.bankId = 'Select a valid bank';
        if (typeof body.branchName !== 'string' || !body.branchName.trim())
            errors.branchName = 'Enter the branch name';
        if (typeof body.accountHolder !== 'string' || body.accountHolder.trim().length < 2)
            errors.accountHolder = 'Enter the account holder name';
        if (typeof body.accountNumber !== 'string' || !/^\d{8,20}$/.test(body.accountNumber.trim()))
            errors.accountNumber = 'Enter an account number with 8–20 digits';
        if (Object.keys(errors).length)
            throw new common_1.UnprocessableEntityException({ message: 'Check the bank details and try again', errors });
        const isCurrent = body.isCurrent === true || body.isCurrent === 'true';
        if (isCurrent)
            o.banks.forEach((item) => { item.isCurrent = false; });
        bank.bankId = body.bankId;
        bank.bank = data_1.LOOKUPS.banks.find((item) => item.value === body.bankId)?.label ?? 'Unknown';
        bank.branch = body.branchName.trim();
        bank.accountHolder = body.accountHolder.trim();
        bank.accountNumber = body.accountNumber.trim();
        if (chequePhoto)
            bank.chequeUrl = `data:${chequePhoto.mimetype};base64,${chequePhoto.buffer.toString('base64')}`;
        bank.isCurrent = isCurrent;
        return bank;
    }
    vehicles(id) {
        const list = data_1.db.vehicles
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
};
exports.VehicleOwnersController = VehicleOwnersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('verified')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)(ownerUploadFields, uploadOptions)),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)(ownerUploadFields, uploadOptions)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/banks'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "banks", null);
__decorate([
    (0, common_1.Post)(':id/banks'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('chequePhoto', chequeUploadOptions)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "addBank", null);
__decorate([
    (0, common_1.Patch)(':id/banks/:bankId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('chequePhoto', chequeUploadOptions)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('bankId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "updateBank", null);
__decorate([
    (0, common_1.Get)(':id/vehicles'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehicleOwnersController.prototype, "vehicles", null);
exports.VehicleOwnersController = VehicleOwnersController = __decorate([
    (0, common_1.Controller)('vehicle-owners'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], VehicleOwnersController);
//# sourceMappingURL=vehicle-owners.controller.js.map