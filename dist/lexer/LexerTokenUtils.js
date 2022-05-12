"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LexerTokenUtils = void 0;
const LexerTokens_1 = require("../lexer/LexerTokens");
class LexerTokenUtils {
    /**
     * Converts tokens to string for error message purposes
     * @param token
     */
    static toString(token) {
        switch (token) {
            case LexerTokens_1.LexerToken.Iden:
                return "identifier";
            case LexerTokens_1.LexerToken.Str:
                return "string";
            case LexerTokens_1.LexerToken.Num:
                return "number";
            case LexerTokens_1.LexerToken.Bool:
                return "bool";
            case LexerTokens_1.LexerToken.define:
                return "define";
            case LexerTokens_1.LexerToken.defMacro:
                return "def-macro";
            case LexerTokens_1.LexerToken.if:
                return "if";
            case LexerTokens_1.LexerToken.let:
                return "let";
            case LexerTokens_1.LexerToken.letrec:
                return "letrec";
            case LexerTokens_1.LexerToken.lambda:
                return "lambda";
            case LexerTokens_1.LexerToken.begin:
                return "begin";
            case LexerTokens_1.LexerToken.null:
                return "null";
            case LexerTokens_1.LexerToken.car:
            case LexerTokens_1.LexerToken.cdr:
            case LexerTokens_1.LexerToken.consp:
                return "unary-operator";
            case LexerTokens_1.LexerToken.or:
            case LexerTokens_1.LexerToken.and:
            case LexerTokens_1.LexerToken.plus:
            case LexerTokens_1.LexerToken.minus:
            case LexerTokens_1.LexerToken.times:
            case LexerTokens_1.LexerToken.division:
            case LexerTokens_1.LexerToken.lt:
            case LexerTokens_1.LexerToken.le:
            case LexerTokens_1.LexerToken.eq:
            case LexerTokens_1.LexerToken.ne:
            case LexerTokens_1.LexerToken.he:
            case LexerTokens_1.LexerToken.ht:
                return "binary-operator";
            case LexerTokens_1.LexerToken.leftBracket:
                return "(";
            case LexerTokens_1.LexerToken.rightBracket:
                return ")";
            case LexerTokens_1.LexerToken.comma:
                return ",";
            case LexerTokens_1.LexerToken.quote:
                return "'";
            case LexerTokens_1.LexerToken.backQuote:
                return "`";
            case LexerTokens_1.LexerToken.true:
            case LexerTokens_1.LexerToken.false:
            default:
                return " ";
        }
    }
}
exports.LexerTokenUtils = LexerTokenUtils;
//# sourceMappingURL=LexerTokenUtils.js.map