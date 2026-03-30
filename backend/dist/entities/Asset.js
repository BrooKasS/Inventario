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
exports.Asset = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Servidor_1 = require("./Servidor");
const Red_1 = require("./Red");
const Ups_1 = require("./Ups");
const BaseDatos_1 = require("./BaseDatos");
const Vpn_1 = require("./Vpn");
const Movil_1 = require("./Movil");
const Bitacora_1 = require("./Bitacora");
let Asset = class Asset {
    generateId() {
        if (!this.id)
            this.id = (0, uuid_1.v4)();
    }
};
exports.Asset = Asset;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar2", length: 36 }),
    __metadata("design:type", String)
], Asset.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Asset.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 20 }),
    __metadata("design:type", String)
], Asset.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Asset.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Asset.prototype, "codigoServicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Asset.prototype, "ubicacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Asset.prototype, "propietario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Asset.prototype, "custodio", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp" }),
    __metadata("design:type", Date)
], Asset.prototype, "creadoEn", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamp" }),
    __metadata("design:type", Date)
], Asset.prototype, "actualizadoEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], Asset.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Servidor_1.Servidor, (s) => s.asset, { cascade: true }),
    __metadata("design:type", Object)
], Asset.prototype, "servidor", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Red_1.Red, (r) => r.asset, { cascade: true }),
    __metadata("design:type", Object)
], Asset.prototype, "red", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Ups_1.Ups, (u) => u.asset, { cascade: true }),
    __metadata("design:type", Object)
], Asset.prototype, "ups", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => BaseDatos_1.BaseDatos, (b) => b.asset, { cascade: true }),
    __metadata("design:type", Object)
], Asset.prototype, "baseDatos", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Vpn_1.Vpn, (v) => v.asset, { cascade: true }),
    __metadata("design:type", Object)
], Asset.prototype, "vpn", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Movil_1.Movil, (m) => m.asset, { cascade: true }),
    __metadata("design:type", Object)
], Asset.prototype, "movil", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Bitacora_1.Bitacora, (b) => b.asset, { cascade: true }),
    __metadata("design:type", Array)
], Asset.prototype, "bitacora", void 0);
exports.Asset = Asset = __decorate([
    (0, typeorm_1.Entity)("ASSETS"),
    (0, typeorm_1.Index)("IDX_ASSET_TIPO", ["tipo"]),
    (0, typeorm_1.Index)("IDX_ASSET_NOMBRE", ["nombre"]),
    (0, typeorm_1.Index)("IDX_ASSET_CODIGO", ["codigoServicio"])
], Asset);
