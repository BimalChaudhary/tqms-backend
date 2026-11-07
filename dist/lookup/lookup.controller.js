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
exports.LookupController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
let LookupController = class LookupController {
    lookup(type, q, parentId) {
        let options = [];
        if (type === 'districts') {
            options = (0, data_1.getDistricts)(parentId);
        }
        else if (type === 'vehicles') {
            options = data_1.db.vehicles
                .filter((v) => !q || v.vehicleNumber.toLowerCase().includes(q.toLowerCase()) || v.plateNo.toLowerCase().includes(q.toLowerCase()))
                .map((v) => ({ value: v.id, label: v.plateNo }));
        }
        else if (type === 'vehicle-owners') {
            options = data_1.db.vehicleOwners
                .filter((o) => !q || o.name.toLowerCase().includes(q.toLowerCase()))
                .map((o) => ({ value: o.id, label: o.name }));
        }
        else if (type === 'vehicle-numbers') {
            options = data_1.db.vehicles.map((v) => ({ value: v.vehicleNumber, label: v.plateNo }));
        }
        else if (type === 'bill-numbers') {
            options = [{ value: 'BN-001', label: 'BN-001' }, { value: 'BN-002', label: 'BN-002' }];
        }
        else {
            options = data_1.LOOKUPS[type] ?? [];
        }
        if (q && type !== 'vehicles' && type !== 'vehicle-owners') {
            const qq = q.toLowerCase();
            options = options.filter((o) => o.label.toLowerCase().includes(qq));
        }
        return options;
    }
};
exports.LookupController = LookupController;
__decorate([
    (0, common_1.Get)(':type'),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LookupController.prototype, "lookup", null);
exports.LookupController = LookupController = __decorate([
    (0, common_1.Controller)('lookup'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], LookupController);
//# sourceMappingURL=lookup.controller.js.map