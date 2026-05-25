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
exports.VpnRule = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const Vpn_1 = require("./Vpn");
let VpnRule = class VpnRule {
    generateId() {
        if (!this.id)
            this.id = (0, uuid_1.v4)();
    }
};
exports.VpnRule = VpnRule;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar2", length: 36 }),
    __metadata("design:type", String)
], VpnRule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VpnRule.prototype, "generateId", null);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Vpn_1.Vpn, (vpn) => vpn.reglas, {
        onDelete: "CASCADE",
        eager: false,
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: "VPN_ID" }),
    __metadata("design:type", Vpn_1.Vpn)
], VpnRule.prototype, "vpn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], VpnRule.prototype, "conexion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], VpnRule.prototype, "fases", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], VpnRule.prototype, "origen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar2", length: 500, nullable: true }),
    __metadata("design:type", Object)
], VpnRule.prototype, "destino", void 0);
exports.VpnRule = VpnRule = __decorate([
    (0, typeorm_1.Entity)("VPN_RULES")
], VpnRule);
