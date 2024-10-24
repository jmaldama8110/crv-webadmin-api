"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const Actions_1 = require("../routers/Actions");
const getHFBranches_1 = require("../utils/getHFBranches");
node_cron_1.default.schedule('* 6 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    // se ejecutara a las 23 horas de cada dia
    try {
        const dbList = yield (0, getHFBranches_1.findDbs)();
        console.log('NODE-CRON started... ');
        for (let x = 0; x < dbList.length; x++) {
            // console.log('Updating LoanApp status for',dbList[x])
            yield (0, Actions_1.updateLoanAppStatus)(dbList[x]);
        }
    }
    catch (e) {
        console.log(`NODE-CRON FAILED error: ${e.message}`);
    }
}));
