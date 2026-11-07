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
exports.QueuesController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
let QueuesController = class QueuesController {
    list(page = '1', pageSize = '10', status, vehicleId, cardType, vehicleType, q) {
        let items = [...data_1.db.queues];
        if (status && status !== 'all')
            items = items.filter((x) => x.status === status);
        if (vehicleId)
            items = items.filter((x) => x.vehicleId === vehicleId);
        if (cardType)
            items = items.filter((x) => x.cardType === cardType);
        if (vehicleType)
            items = items.filter((x) => x.vehicleType === vehicleType);
        if (q) {
            const qq = q.toLowerCase();
            items = items.filter((x) => x.vehicleNumber.toLowerCase().includes(qq) ||
                x.queueNumber.toLowerCase().includes(qq));
        }
        const mapped = items.map((q) => ({
            id: q.id,
            queueNumber: q.queueNumber,
            vehicleNumber: q.vehicleNumber,
            vehicleType: q.vehicleType,
            cardType: q.cardType,
            lastCheckpoint: q.lastCheckpoint,
            status: q.status,
        }));
        return (0, data_1.paginate)(mapped, +page, +pageSize);
    }
    pending() {
        return data_1.db.pendingQueues.map((p) => ({
            id: p.id,
            vehicleNumber: p.vehicleNumber,
            route: p.route,
            entryDate: p.entryDate,
        }));
    }
    pendingGet(id) {
        const p = data_1.db.pendingQueues.find((x) => x.id === id);
        if (!p)
            throw new common_1.NotFoundException('Pending queue not found');
        return p;
    }
    pendingApprove(id, body) {
        const idx = data_1.db.pendingQueues.findIndex((x) => x.id === id);
        if (idx < 0)
            throw new common_1.NotFoundException('Pending queue not found');
        const pending = data_1.db.pendingQueues[idx];
        data_1.db.pendingQueues.splice(idx, 1);
        let vehicleNumber = pending.vehicleNumber;
        let vehicleType = 'Unknown';
        let owner = null;
        let isRegistered = false;
        let sangh = null;
        if (body.matchedVehicleId) {
            const v = data_1.db.vehicles.find((x) => x.id === body.matchedVehicleId);
            if (v) {
                vehicleNumber = v.plateNo;
                vehicleType = v.vehicleType;
                owner = v.ownerName;
                isRegistered = true;
                sangh = v.sanghName;
            }
        }
        const queue = {
            id: (0, data_1.newId)(),
            queueNumber: `Q-${Date.now()}`,
            vehicleNumber,
            vehicleId: body.matchedVehicleId,
            vehicleType,
            cardType: null,
            cardNumber: null,
            lastCheckpoint: 'Current Checkpoint',
            status: 'in_queue',
            owner,
            isRegistered,
            sangh,
            route: `${body.from} → ${body.to}`,
            transportCompany: null,
            loadDetails: body.material,
            checkpointWeight: body.grossWeight,
            entryDate: new Date().toISOString(),
            from: body.from,
            to: body.to,
            kind: isRegistered ? 'registered' : 'unregistered',
            entries: [
                {
                    id: (0, data_1.newId)(),
                    entryDate: new Date().toISOString(),
                    from: body.from,
                    to: body.to,
                    weights: { cp1: body.grossWeight, cp2: null, cp3: null },
                    billNo: null,
                },
            ],
        };
        data_1.db.queues.unshift(queue);
        return queue;
    }
    pendingRemove(id) {
        const idx = data_1.db.pendingQueues.findIndex((x) => x.id === id);
        if (idx < 0)
            throw new common_1.NotFoundException('Pending queue not found');
        data_1.db.pendingQueues.splice(idx, 1);
        return undefined;
    }
    get(id) {
        const q = data_1.db.queues.find((x) => x.id === id);
        if (!q)
            throw new common_1.NotFoundException('Queue not found');
        return q;
    }
    create(body) {
        let vehicleNumber = body.vehicleNumber ?? 'UNKNOWN';
        let vehicleType = 'Unknown';
        let owner = null;
        let isRegistered = body.kind === 'registered';
        let sangh = null;
        let vehicleId = body.vehicleId;
        if (body.vehicleId) {
            const v = data_1.db.vehicles.find((x) => x.id === body.vehicleId);
            if (v) {
                vehicleNumber = v.plateNo;
                vehicleType = v.vehicleType;
                owner = v.ownerName;
                sangh = v.sanghName;
                isRegistered = true;
            }
        }
        else if (body.vehicleTypeId) {
            const vt = data_1.db.vehicles;
            vehicleType = 'Truck';
        }
        const queue = {
            id: (0, data_1.newId)(),
            queueNumber: `Q-${Date.now()}`,
            vehicleNumber,
            vehicleId,
            vehicleType,
            cardType: null,
            cardNumber: null,
            lastCheckpoint: 'Current Checkpoint',
            status: 'in_queue',
            owner,
            isRegistered,
            sangh,
            route: `${body.from} → ${body.to}`,
            transportCompany: body.transportCompany ?? null,
            loadDetails: body.loadDetails,
            checkpointWeight: body.grossWeight,
            entryDate: new Date().toISOString(),
            from: body.from,
            to: body.to,
            kind: body.kind,
            entries: [
                {
                    id: (0, data_1.newId)(),
                    entryDate: new Date().toISOString(),
                    from: body.from,
                    to: body.to,
                    weights: { cp1: body.grossWeight, cp2: null, cp3: null },
                    billNo: null,
                },
            ],
        };
        data_1.db.queues.unshift(queue);
        return queue;
    }
    checkIn(id, body) {
        const q = data_1.db.queues.find((x) => x.id === id);
        if (!q)
            throw new common_1.NotFoundException('Queue not found');
        q.status = 'in_job';
        q.checkpointWeight = body.grossWeight;
        if (q.entries[0])
            q.entries[0].weights.cp1 = body.grossWeight;
        return q;
    }
    endJourney(id) {
        const q = data_1.db.queues.find((x) => x.id === id);
        if (!q)
            throw new common_1.NotFoundException('Queue not found');
        q.status = 'payment_pending';
        return q;
    }
    receipt(id) {
        const q = data_1.db.queues.find((x) => x.id === id);
        if (!q)
            throw new common_1.NotFoundException('Queue not found');
        const now = new Date();
        return {
            receiptNo: `RCPT-${q.queueNumber}`,
            date: now.toISOString().slice(0, 10),
            time: now.toTimeString().slice(0, 8),
            sangh: q.sangh ?? 'N/A',
            checkpoint: 'Current Checkpoint',
            vehicleNumber: q.vehicleNumber,
            load: q.loadDetails,
            narration: data_1.db.narration,
            weight: q.checkpointWeight,
            charges: [
                { label: 'Weighbridge fee', amount: 50 },
                { label: 'Entry fee', amount: 100 },
            ],
            total: 150,
        };
    }
};
exports.QueuesController = QueuesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('vehicleId')),
    __param(4, (0, common_1.Query)('cardType')),
    __param(5, (0, common_1.Query)('vehicleType')),
    __param(6, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "pending", null);
__decorate([
    (0, common_1.Get)('pending/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "pendingGet", null);
__decorate([
    (0, common_1.Post)('pending/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "pendingApprove", null);
__decorate([
    (0, common_1.Delete)('pending/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "pendingRemove", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/check-in'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "checkIn", null);
__decorate([
    (0, common_1.Post)(':id/end-journey'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "endJourney", null);
__decorate([
    (0, common_1.Get)(':id/receipt'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QueuesController.prototype, "receipt", null);
exports.QueuesController = QueuesController = __decorate([
    (0, common_1.Controller)('queues'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], QueuesController);
//# sourceMappingURL=queues.controller.js.map