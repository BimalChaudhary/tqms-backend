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
exports.VehiclesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
const SUB_RESOURCES = ['documents', 'owners', 'beneficiaries', 'check-passes', 'route-permits', 'insurances', 'type-cards', 'bluebooks'];
function assertSubResource(resource) {
    if (!SUB_RESOURCES.includes(resource))
        throw new common_1.BadRequestException('Unknown vehicle detail section');
}
function optionLabel(type, value) {
    return typeof value === 'string' ? data_1.LOOKUPS[type]?.find((option) => option.value === value)?.label ?? null : null;
}
function decorateSubRecord(resource, values) {
    const row = { ...values };
    if (resource === 'documents')
        row.documentTypeIdLabel = optionLabel('document-types', row.documentTypeId);
    if (resource === 'owners') {
        const owner = data_1.db.vehicleOwners.find((item) => item.id === row.ownerId);
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
function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function validateSubRecord(resource, values) {
    const errors = {};
    const requiredText = (field, message) => {
        if (typeof values[field] !== 'string' || !values[field].trim())
            errors[field] = message;
    };
    const dateRange = (start, end) => {
        if (!isValidDate(values[start]))
            errors[start] = 'Enter a valid date';
        if (!isValidDate(values[end]))
            errors[end] = 'Enter a valid date';
        else if (isValidDate(values[start]) && values[end] < values[start])
            errors[end] = 'End date must be on or after start date';
    };
    if (resource === 'documents') {
        requiredText('name', 'Enter a document name');
        if (!data_1.LOOKUPS['document-types'].some((item) => item.value === values.documentTypeId))
            errors.documentTypeId = 'Select a document type';
        if (!values.documentUrl)
            errors.document = 'Upload the document';
    }
    else if (resource === 'owners') {
        if (!data_1.db.vehicleOwners.some((item) => item.id === values.ownerId))
            errors.ownerId = 'Select a valid vehicle owner';
    }
    else if (resource === 'beneficiaries') {
        requiredText('name', 'Enter the beneficiary name');
        const contact = typeof values.contact === 'string' ? values.contact.trim() : '';
        if (!/^9[678]\d{8}$/.test(contact))
            errors.contact = 'Enter a valid 10-digit Nepal mobile number';
    }
    else if (resource === 'check-passes' || resource === 'route-permits') {
        dateRange('from', 'to');
        if (resource === 'route-permits' && !values.documentUrl)
            errors.document = 'Upload the route permit';
    }
    else if (resource === 'insurances') {
        if (!data_1.LOOKUPS['insurance-companies'].some((item) => item.value === values.companyId))
            errors.companyId = 'Select an insurance company';
        requiredText('policyNumber', 'Enter the policy number');
        if (!data_1.LOOKUPS['policy-types'].some((item) => item.value === values.policyTypeId))
            errors.policyTypeId = 'Select a policy type';
        dateRange('startDate', 'expiryDate');
    }
    else if (resource === 'type-cards') {
        if (!data_1.LOOKUPS['card-types'].some((item) => item.value === values.cardTypeId))
            errors.cardTypeId = 'Select a card type';
        if (!data_1.LOOKUPS.sanghs.some((item) => item.value === values.sanghId))
            errors.sanghId = 'Select a sthaniya sangh';
        dateRange('startDate', 'expiryDate');
        requiredText('narration', 'Enter the narration');
    }
    else if (resource === 'bluebooks') {
        dateRange('registrationDate', 'expiryDate');
    }
    if (Object.keys(errors).length)
        throw new common_1.UnprocessableEntityException({ message: 'Check the record details and try again', errors });
}
const documentUploadOptions = {
    limits: { files: 1, fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const extension = file.originalname.toLowerCase().split('.').pop();
        const supported = file.mimetype === 'image/jpeg' && ['jpg', 'jpeg'].includes(extension ?? '')
            || file.mimetype === 'image/png' && extension === 'png'
            || file.mimetype === 'image/webp' && extension === 'webp'
            || file.mimetype === 'application/pdf' && extension === 'pdf';
        if (!supported)
            return cb(new common_1.BadRequestException('Choose a JPG, PNG, WebP or PDF document'), false);
        cb(null, true);
    },
};
function withDocument(values, uploads) {
    const file = uploads?.document?.[0];
    return file ? { ...values, documentName: file.originalname, documentUrl: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` } : values;
}
function lookupCode(type, id) {
    const label = optionLabel(type, id) ?? '';
    return label.match(/^\(([^)]+)\)/)?.[1] ?? label.match(/\(([^)]+)\)$/)?.[1] ?? label;
}
function formatPlate(body) {
    if (body.plateType === 'embossed')
        return String(body.embossedNumber ?? '').trim();
    const symbol = lookupCode('symbols', body.symbolId);
    const suffix = [body.lotNo, symbol, body.vehicleNumber].filter(Boolean);
    if (body.plateType === 'zonal')
        return [lookupCode('zonal-codes', body.zonalCodeId), ...suffix].filter(Boolean).join('-');
    const provinceCode = lookupCode('provinces', body.provinceId).replace(/\D/g, '');
    return [`Province-${provinceCode}`, ...suffix].filter(Boolean).join('-');
}
function validateVehicle(body) {
    const errors = {};
    if (!data_1.LOOKUPS.sanghs.some((item) => item.value === body.sanghId))
        errors.sanghId = 'Select a valid sthaniya sangh';
    if (!data_1.db.vehicleOwners.some((item) => item.id === body.ownerId))
        errors.ownerId = 'Select a valid vehicle owner';
    if (!data_1.LOOKUPS['vehicle-types'].some((item) => item.value === body.vehicleTypeId))
        errors.vehicleTypeId = 'Select a valid vehicle type';
    if (!data_1.LOOKUPS['plate-colors'].some((item) => item.value === body.plateColorId))
        errors.plateColorId = 'Select a plate colour';
    if (!['embossed', 'provincial', 'zonal'].includes(body.plateType))
        errors.plateType = 'Select a valid plate type';
    if (body.plateType === 'zonal' && !data_1.LOOKUPS['zonal-codes'].some((item) => item.value === body.zonalCodeId))
        errors.zonalCodeId = 'Select a zonal code';
    if (body.plateType === 'provincial' && !data_1.LOOKUPS.provinces.some((item) => item.value === body.provinceId))
        errors.provinceId = 'Select a state';
    if (['provincial', 'zonal'].includes(body.plateType)) {
        if (!data_1.LOOKUPS.symbols.some((item) => item.value === body.symbolId))
            errors.symbolId = 'Select a vehicle symbol';
        if (typeof body.lotNo !== 'string' || !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(body.lotNo.trim()))
            errors.lotNo = 'Enter a valid lot number';
        if (typeof body.vehicleNumber !== 'string' || !/^\d{1,4}$/.test(body.vehicleNumber.trim()))
            errors.vehicleNumber = 'Enter a 1–4 digit vehicle number';
    }
    if (body.plateType === 'embossed' && (typeof body.embossedNumber !== 'string' || !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(body.embossedNumber.trim())))
        errors.embossedNumber = 'Enter a valid embossed plate number';
    if (Object.keys(errors).length)
        throw new common_1.UnprocessableEntityException({ message: 'Check the vehicle details and try again', errors });
}
function addVehicleAudit(vehicle, action, detail) {
    vehicle.auditLogs.unshift({ id: (0, data_1.newId)(), at: new Date().toISOString(), user: 'System', action, detail });
}
function syncInsuranceSummary(vehicle) {
    const latest = [...(vehicle.sub.insurances ?? [])].sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))[0];
    vehicle.general.insuranceCompany = latest?.companyIdLabel ?? null;
    vehicle.general.policyType = latest?.policyTypeIdLabel ?? null;
    vehicle.general.policyNumber = latest?.policyNumber ?? null;
    vehicle.general.policyExpiry = latest?.expiryDate ?? null;
}
let VehiclesController = class VehiclesController {
    list(page = '1', pageSize = '10', q) {
        let items = data_1.db.vehicles.map((v) => ({
            id: v.id,
            plateNo: v.plateNo,
            lotNo: v.lotNo,
            vehicleNumber: v.vehicleNumber,
            vehicleType: v.vehicleType,
        }));
        if (q) {
            const qq = q.toLowerCase();
            items = items.filter((v) => v.plateNo.toLowerCase().includes(qq) ||
                v.vehicleNumber.toLowerCase().includes(qq));
        }
        return (0, data_1.paginate)(items, +page, +pageSize);
    }
    get(id) {
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
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
    create(body) {
        validateVehicle(body);
        const plateNo = formatPlate(body);
        if (data_1.db.vehicles.some((v) => v.plateNo.toLowerCase() === plateNo.toLowerCase())) {
            throw new common_1.UnprocessableEntityException({
                message: 'Validation failed',
                errors: { vehicleNumber: 'Vehicle number already exists' },
            });
        }
        const owner = data_1.db.vehicleOwners.find((o) => o.id === body.ownerId);
        const vehicleType = optionLabel('vehicle-types', body.vehicleTypeId) ?? 'Unknown';
        const sanghName = optionLabel('sanghs', body.sanghId);
        const v = {
            id: (0, data_1.newId)(),
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
                    id: (0, data_1.newId)(),
                    at: new Date().toISOString(),
                    user: 'System',
                    action: 'Created',
                    detail: 'Vehicle created',
                },
            ],
        };
        data_1.db.vehicles.push(v);
        return {
            id: v.id,
            plateNo: v.plateNo,
            lotNo: v.lotNo,
            vehicleNumber: v.vehicleNumber,
            vehicleType: v.vehicleType,
        };
    }
    update(id, body) {
        const idx = data_1.db.vehicles.findIndex((x) => x.id === id);
        if (idx < 0)
            throw new common_1.NotFoundException('Vehicle not found');
        const v = data_1.db.vehicles[idx];
        validateVehicle(body);
        const plateNo = formatPlate(body);
        if (data_1.db.vehicles.some((item) => item.id !== id && item.plateNo.toLowerCase() === plateNo.toLowerCase())) {
            throw new common_1.UnprocessableEntityException({ message: 'Validation failed', errors: { vehicleNumber: 'Vehicle number already exists' } });
        }
        Object.assign(v.form, body);
        const owner = data_1.db.vehicleOwners.find((item) => item.id === body.ownerId);
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
            id: (0, data_1.newId)(),
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
    auditLogs(id) {
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
        return v.auditLogs;
    }
    getTare(id) {
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
        return { tareWeight: v.tareWeight };
    }
    setTare(id, body) {
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
        if (typeof body.tareWeight !== 'number' || !Number.isFinite(body.tareWeight) || body.tareWeight < 1 || body.tareWeight > 100000) {
            throw new common_1.UnprocessableEntityException({ message: 'Enter a tare weight between 1 and 100,000 kg', errors: { tareWeight: 'Enter a tare weight between 1 and 100,000 kg' } });
        }
        v.tareWeight = body.tareWeight;
        addVehicleAudit(v, 'Updated', 'Tare weight updated');
        return { tareWeight: v.tareWeight };
    }
    subList(id, resource) {
        assertSubResource(resource);
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
        return (v.sub[resource] ?? []).map((row) => decorateSubRecord(resource, row));
    }
    subCreate(id, resource, body, uploads) {
        assertSubResource(resource);
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
        if (!v.sub[resource])
            v.sub[resource] = [];
        const values = withDocument(body, uploads);
        validateSubRecord(resource, values);
        const row = decorateSubRecord(resource, { id: (0, data_1.newId)(), ...values });
        v.sub[resource].push(row);
        if (resource === 'insurances')
            syncInsuranceSummary(v);
        addVehicleAudit(v, 'Added', `${resource} record added`);
        return row;
    }
    subUpdate(id, resource, rid, body, uploads) {
        assertSubResource(resource);
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
        const list = v.sub[resource] ?? [];
        const idx = list.findIndex((r) => r.id === rid);
        if (idx < 0)
            throw new common_1.NotFoundException('Record not found');
        const values = withDocument({ ...list[idx], ...body }, uploads);
        validateSubRecord(resource, values);
        list[idx] = decorateSubRecord(resource, { ...values, id: rid });
        if (resource === 'insurances')
            syncInsuranceSummary(v);
        addVehicleAudit(v, 'Updated', `${resource} record updated`);
        return list[idx];
    }
    subRemove(id, resource, rid) {
        assertSubResource(resource);
        const v = data_1.db.vehicles.find((x) => x.id === id);
        if (!v)
            throw new common_1.NotFoundException('Vehicle not found');
        const list = v.sub[resource] ?? [];
        const idx = list.findIndex((r) => r.id === rid);
        if (idx < 0)
            throw new common_1.NotFoundException('Record not found');
        list.splice(idx, 1);
        if (resource === 'insurances')
            syncInsuranceSummary(v);
        addVehicleAudit(v, 'Deleted', `${resource} record deleted`);
        return undefined;
    }
};
exports.VehiclesController = VehiclesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/audit-logs'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "auditLogs", null);
__decorate([
    (0, common_1.Get)(':id/tare-weight'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "getTare", null);
__decorate([
    (0, common_1.Patch)(':id/tare-weight'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "setTare", null);
__decorate([
    (0, common_1.Get)(':id/:resource'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('resource')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "subList", null);
__decorate([
    (0, common_1.Post)(':id/:resource'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'document', maxCount: 1 }], documentUploadOptions)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('resource')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "subCreate", null);
__decorate([
    (0, common_1.Patch)(':id/:resource/:rid'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'document', maxCount: 1 }], documentUploadOptions)),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('resource')),
    __param(2, (0, common_1.Param)('rid')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "subUpdate", null);
__decorate([
    (0, common_1.Delete)(':id/:resource/:rid'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('resource')),
    __param(2, (0, common_1.Param)('rid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], VehiclesController.prototype, "subRemove", null);
exports.VehiclesController = VehiclesController = __decorate([
    (0, common_1.Controller)('vehicles'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], VehiclesController);
//# sourceMappingURL=vehicles.controller.js.map