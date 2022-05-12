"use strict";
/**
 * Type of lexer token
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["NUMBER"] = 0] = "NUMBER";
    TokenType[TokenType["IDENTIFIER"] = 1] = "IDENTIFIER";
    TokenType[TokenType["STRING"] = 2] = "STRING";
    TokenType[TokenType["SPEC"] = 3] = "SPEC";
    TokenType[TokenType["WHITESPACE"] = 4] = "WHITESPACE";
    TokenType[TokenType["INVALID"] = 5] = "INVALID";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
//# sourceMappingURL=TokenType.js.map