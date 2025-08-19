"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainRoute = void 0;
const express_1 = __importDefault(require("express"));
const main_controller_1 = require("../controller/main_controller");
exports.mainRoute = express_1.default.Router();
exports.mainRoute.post('/', main_controller_1.classifyDissease);
