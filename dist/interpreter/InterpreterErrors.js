"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterpreterError = void 0;
class InterpreterError extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}
exports.InterpreterError = InterpreterError;
//# sourceMappingURL=InterpreterErrors.js.map