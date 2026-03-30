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
exports.Servidor = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Asset_1 = require("./Asset");
let Servidor = class Servidor {
    generateId() {
        if (!this.id)
            this.id = (0, uuid_1.v4)();
    }
};
exports.Servidor = Servidor;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar2", length: 36 }),
    __metadata("design:type", String)
], Servidor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Servidor.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.OneToOne)(() => Asset_1.Asset, (a) => a.servidor, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "ASSET_ID" }),
    __metadata("design:type", Asset_1.Asset)
], Servidor.prototype, "asset", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "monitoreo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "backup", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "ipInterna", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "ipGestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "ipServicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "ambiente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "tipoServidor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 1000, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "appSoporta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "number", nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "vcpu", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "number", nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "vramMb", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "sistemaOperativo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "fechaFinSoporte", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 1000, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "rutasBackup", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], Servidor.prototype, "contratoQueSoporta", void 0);
exports.Servidor = Servidor = __decorate([
    (0, typeorm_1.Entity)("SERVIDORES")
], Servidor);
