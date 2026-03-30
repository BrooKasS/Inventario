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
exports.Ups = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Asset_1 = require("./Asset");
let Ups = class Ups {
    generateId() {
        if (!this.id)
            this.id = (0, uuid_1.v4)();
    }
};
exports.Ups = Ups;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar2", length: 36 }),
    __metadata("design:type", String)
], Ups.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Ups.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.OneToOne)(() => Asset_1.Asset, (a) => a.ups, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "ASSET_ID" }),
    __metadata("design:type", Asset_1.Asset)
], Ups.prototype, "asset", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 200, nullable: true }),
    __metadata("design:type", Object)
], Ups.prototype, "serial", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 200, nullable: true }),
    __metadata("design:type", Object)
], Ups.prototype, "placa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Ups.prototype, "modelo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Ups.prototype, "estado", void 0);
exports.Ups = Ups = __decorate([
    (0, typeorm_1.Entity)("UPS")
], Ups);
