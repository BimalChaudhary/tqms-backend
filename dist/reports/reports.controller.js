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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
let ReportsController = class ReportsController {
    checkpointEntries(name, start, end, page = '1', pageSize = '1000') {
        const data = data_1.db.queues.map((q, i) => ({
            id: q.id,
            sn: i + 1,
            name: q.owner ?? q.vehicleNumber,
            vehicleNumber: q.vehicleNumber,
            entryDate: q.entryDate,
            status: q.status,
            weight: q.checkpointWeight,
        }));
        return {
            data,
            meta: {
                page: +page,
                pageSize: +pageSize,
                total: data.length,
                totalPages: 1,
            },
        };
    }
    detailEntries(start, end, vehicleNo, goods, billNo, page = '1', pageSize = '1000') {
        let items = data_1.db.queues.flatMap((q) => q.entries.map((e) => ({
            id: e.id,
            dateTime: e.entryDate ?? q.entryDate,
            receiptNo: e.billNo ?? e.id,
            vehicleNo: q.vehicleNumber,
            vehicleType: q.vehicleType,
            checkpoint: q.lastCheckpoint ?? '—',
            route: `${e.from ?? q.from} → ${e.to ?? q.to}`,
            grossWeight: e.weights?.cp1 ?? q.checkpointWeight ?? 0,
            material: q.loadDetails ?? '—',
            remarks: e.remarks ?? null,
            billNo: e.billNo,
        })));
        if (start)
            items = items.filter((x) => x.dateTime.slice(0, 10) >= start);
        if (end)
            items = items.filter((x) => x.dateTime.slice(0, 10) <= end);
        if (vehicleNo) {
            items = items.filter((x) => x.vehicleNo.toLowerCase().includes(vehicleNo.toLowerCase()));
        }
        if (goods) {
            const material = data_1.LOOKUPS.goods.find((x) => x.value === goods)?.label ?? goods;
            items = items.filter((x) => x.material.toLowerCase().includes(material.toLowerCase()));
        }
        if (billNo) {
            items = items.filter((x) => (x.billNo ?? '').toLowerCase().includes(billNo.toLowerCase()));
        }
        return (0, data_1.paginate)(items, +page, +pageSize);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('checkpoint-entries'),
    __param(0, (0, common_1.Query)('name')),
    __param(1, (0, common_1.Query)('start')),
    __param(2, (0, common_1.Query)('end')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "checkpointEntries", null);
__decorate([
    (0, common_1.Get)('detail-entries'),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __param(2, (0, common_1.Query)('vehicleNo')),
    __param(3, (0, common_1.Query)('goods')),
    __param(4, (0, common_1.Query)('billNo')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "detailEntries", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], ReportsController);
//# sourceMappingURL=reports.controller.js.map