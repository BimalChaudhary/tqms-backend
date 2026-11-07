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
exports.OtherVehiclesController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
let OtherVehiclesController = class OtherVehiclesController {
    list(page = '1', pageSize = '10', kind, q) {
        let items = [...data_1.db.otherVehicles];
        if (kind && kind !== 'all')
            items = items.filter((x) => x.kind === kind);
        if (q) {
            const qq = q.toLowerCase();
            items = items.filter((x) => x.vehicleNumber.toLowerCase().includes(qq));
        }
        const plateTypes = data_1.LOOKUPS['plate-types'];
        const vehicleTypes = data_1.LOOKUPS['vehicle-types'];
        const rows = items.map((item) => ({
            ...item,
            formattedNo: item.vehicleNumber.trim().toUpperCase(),
            plateType: plateTypes.find((x) => x.value === item.plateTypeId)?.label ?? null,
            vehicleType: vehicleTypes.find((x) => x.value === item.vehicleTypeId)?.label ?? item.vehicleType,
        }));
        return (0, data_1.paginate)(rows, +page, +pageSize);
    }
    create(body) {
        const row = {
            id: (0, data_1.newId)(),
            kind: body.kind,
            vehicleNumber: body.vehicleNumber,
            vehicleTypeId: body.vehicleTypeId,
            vehicleType: 'Truck',
            plateTypeId: body.plateTypeId,
        };
        data_1.db.otherVehicles.push(row);
        return {
            ...row,
            formattedNo: row.vehicleNumber.trim().toUpperCase(),
            plateType: data_1.LOOKUPS['plate-types'].find((x) => x.value === row.plateTypeId)?.label ?? null,
        };
    }
};
exports.OtherVehiclesController = OtherVehiclesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('kind')),
    __param(3, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], OtherVehiclesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OtherVehiclesController.prototype, "create", null);
exports.OtherVehiclesController = OtherVehiclesController = __decorate([
    (0, common_1.Controller)('other-vehicles'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], OtherVehiclesController);
//# sourceMappingURL=other-vehicles.controller.js.map