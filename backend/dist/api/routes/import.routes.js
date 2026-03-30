"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const import_controller_1 = require("../controllers/import.controller");
const errorHandler_1 = require("../../middlewares/errorHandler");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const uploadDir = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const upload = (0, multer_1.default)({
    dest: uploadDir,
    limits: { fileSize: 10 * 1024 * 1024 },
});
router.post("/", upload.single("file"), (0, errorHandler_1.asyncHandler)(import_controller_1.importController.importExcel.bind(import_controller_1.importController)));
exports.default = router;
