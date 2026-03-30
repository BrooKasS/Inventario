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
exports.BaseDatos = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Asset_1 = require("./Asset");
let BaseDatos = class BaseDatos {
    generateId() {
        if (!this.id)
            this.id = (0, uuid_1.v4)();
    }
};
exports.BaseDatos = BaseDatos;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar2", length: 36 }),
    __metadata("design:type", String)
], BaseDatos.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BaseDatos.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.OneToOne)(() => Asset_1.Asset, (a) => a.baseDatos, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "ASSET_ID" }),
    __metadata("design:type", Asset_1.Asset)
], BaseDatos.prototype, "asset", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "servidor1", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "servidor2", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "racScan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "ambiente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 1000, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "appSoporta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 100, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "versionBd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "fechaFinalSoporte", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "contenedorFisico", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], BaseDatos.prototype, "contratoQueSoporta", void 0);
exports.BaseDatos = BaseDatos = __decorate([
    (0, typeorm_1.Entity)("BASE_DATOS")
], BaseDatos);
