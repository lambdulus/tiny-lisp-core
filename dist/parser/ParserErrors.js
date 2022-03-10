"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SyntaxError extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}
exports.SyntaxError = SyntaxError;
class ParserError extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}
exports.ParserError = ParserError;
//# sourceMappingURL=ParserErrors.js.map