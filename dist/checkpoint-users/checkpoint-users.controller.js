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
exports.CheckpointUsersController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../common/auth.guard");
const data_1 = require("../store/data");
let CheckpointUsersController = class CheckpointUsersController {
    list(page = '1', pageSize = '10', q) {
        let items = [...data_1.db.checkpointUsers];
        if (q) {
            const qq = q.toLowerCase();
            items = items.filter((u) => u.name.toLowerCase().includes(qq) ||
                u.contact.includes(qq) ||
                (u.address ?? '').toLowerCase().includes(qq) ||
                u.email.toLowerCase().includes(qq));
        }
        return (0, data_1.paginate)(items, +page, +pageSize);
    }
    get(id) {
        const u = data_1.db.checkpointUsers.find((x) => x.id === id);
        if (!u)
            throw new common_1.NotFoundException('User not found');
        return u;
    }
    create(body) {
        if (data_1.db.checkpointUsers.some((u) => u.email === body.email)) {
            throw new common_1.UnprocessableEntityException({
                message: 'Validation failed',
                errors: { email: 'Email already in use' },
            });
        }
        const user = {
            id: (0, data_1.newId)(),
            name: body.name,
            address: body.address ?? null,
            contact: body.contact,
            email: body.email,
            provinceId: body.provinceId,
            districtId: body.districtId,
            isActive: body.isActive ?? true,
        };
        data_1.db.checkpointUsers.push(user);
        return user;
    }
    update(id, body) {
        const idx = data_1.db.checkpointUsers.findIndex((x) => x.id === id);
        if (idx < 0)
            throw new common_1.NotFoundException('User not found');
        if (body.email && body.email !== data_1.db.checkpointUsers[idx].email) {
            if (data_1.db.checkpointUsers.some((u) => u.email === body.email)) {
                throw new common_1.UnprocessableEntityException({
                    message: 'Validation failed',
                    errors: { email: 'Email already in use' },
                });
            }
        }
        data_1.db.checkpointUsers[idx] = { ...data_1.db.checkpointUsers[idx], ...body, id };
        return data_1.db.checkpointUsers[idx];
    }
    setStatus(id, body) {
        const idx = data_1.db.checkpointUsers.findIndex((x) => x.id === id);
        if (idx < 0)
            throw new common_1.NotFoundException('User not found');
        data_1.db.checkpointUsers[idx].isActive = !!body.isActive;
        return data_1.db.checkpointUsers[idx];
    }
    remove(id) {
        const idx = data_1.db.checkpointUsers.findIndex((x) => x.id === id);
        if (idx < 0)
            throw new common_1.NotFoundException('User not found');
        data_1.db.checkpointUsers.splice(idx, 1);
        return undefined;
    }
};
exports.CheckpointUsersController = CheckpointUsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], CheckpointUsersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CheckpointUsersController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CheckpointUsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CheckpointUsersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CheckpointUsersController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CheckpointUsersController.prototype, "remove", null);
exports.CheckpointUsersController = CheckpointUsersController = __decorate([
    (0, common_1.Controller)('checkpoint-users'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], CheckpointUsersController);
//# sourceMappingURL=checkpoint-users.controller.js.map