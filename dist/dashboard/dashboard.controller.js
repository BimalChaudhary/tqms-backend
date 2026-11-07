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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
let DashboardController = class DashboardController {
    stats() {
        return {
            inQueue: data_1.db.queues.filter((q) => q.status === 'in_queue').length,
            inJob: data_1.db.queues.filter((q) => q.status === 'in_job').length,
            pendingApprovals: data_1.db.pendingQueues.length,
            paymentPending: data_1.db.queues.filter((q) => q.status === 'payment_pending').length,
            todayEntries: data_1.db.queues.filter((q) => {
                const d = new Date(q.entryDate);
                const today = new Date();
                return d.toDateString() === today.toDateString();
            }).length,
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "stats", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)('dashboard'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map