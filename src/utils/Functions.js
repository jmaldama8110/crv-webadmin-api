"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Functions = void 0;
class Functions {
    constructor() {
    }
    validateInt(value, value_default = 0) {
        value = (value == null ? 0 : value);
        return (value > 2147483647 ? value_default : value);
    }
}
exports.Functions = Functions;
