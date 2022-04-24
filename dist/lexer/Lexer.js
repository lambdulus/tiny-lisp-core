"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TokenType_1 = require("./TokenType");
const LexerTokens_1 = require("./LexerTokens");
const LexerErrors_1 = require("./LexerErrors");
class Lexer {
    constructor(input) {
        this.inputBuffer = input;
        this.lastChar = null;
        this.currVal = 0;
        this.currIdentifier = "";
    }
    /**
     * Loads next char from the source code
     * @private
     */
    getNextChar() {
        if (this.inputBuffer) {
            const result = this.inputBuffer.charAt(0);
            this.inputBuffer = this.inputBuffer.substring(1);
            return result;
        }
        return null;
    }
    /**
     * Loads next non whitespace char
     * @private
     */
    loadNonWhitespace() {
        let res = this.getNextChar();
        if (!res)
            return null;
        if (Lexer.getTokenType(res) == TokenType_1.TokenType.WHITESPACE)
            return this.loadNonWhitespace();
        return res;
    }
    /**
     * If lastChar is not non whitespace character it loads next non whitespace character.
     */
    removeWhitespaces() {
        while (this.lastChar == null || Lexer.getTokenType(this.lastChar) === TokenType_1.TokenType.WHITESPACE)
            this.lastChar = this.getNextChar();
    }
    /**
     * If lastChar is not null and not whitespace return it. Othrewise return next non whitespace character.
     * @private
     */
    loadFirstChar() {
        let dataType = Lexer.getTokenType(this.lastChar);
        return (dataType == TokenType_1.TokenType.INVALID || dataType == TokenType_1.TokenType.WHITESPACE)
            ? this.loadNonWhitespace() : this.lastChar;
    }
    /**
     * Get type of the token based on the first character
     * @param char - first character
     * @private
     */
    static getTokenType(char) {
        if (!char)
            return TokenType_1.TokenType.INVALID;
        if (char == "\"")
            return TokenType_1.TokenType.STRING;
        if (char.match(/[0-9]/i))
            return TokenType_1.TokenType.NUMBER;
        else if (char.match(/[a-z]|[A-Z]"/i))
            return TokenType_1.TokenType.IDENTIFIER;
        else if (!/\S/.test(char)) {
            return TokenType_1.TokenType.WHITESPACE;
        }
        return TokenType_1.TokenType.SPEC;
    }
    /**
     * Loads number and stores it to currVal variable
     * @param result - first digit of the number
     * @private
     */
    loadNumber(result) {
        let currChar = this.getNextChar();
        let currDataType = Lexer.getTokenType(currChar);
        while (currDataType == TokenType_1.TokenType.NUMBER) {
            result = result * 10 + Number(currChar);
            currChar = this.getNextChar();
            currDataType = Lexer.getTokenType(currChar);
        }
        this.lastChar = currChar;
        this.currIdentifier = result.toString();
        this.currVal = result;
        return LexerTokens_1.LexerToken.Num;
    }
    /**
     * Loads keyword token
     * @param str - first token of the keyword
     * @private
     */
    static loadKeywordToken(str) {
        switch (str) {
            case "if":
                return LexerTokens_1.LexerToken.if;
            case "let":
                return LexerTokens_1.LexerToken.let;
            case "letrec":
                return LexerTokens_1.LexerToken.letrec;
            case "lambda":
                return LexerTokens_1.LexerToken.lambda;
            case "begin":
                return LexerTokens_1.LexerToken.begin;
            case "car":
                return LexerTokens_1.LexerToken.car;
            case "cdr":
                return LexerTokens_1.LexerToken.cdr;
            case "cons":
                return LexerTokens_1.LexerToken.cons;
            case "consp":
                return LexerTokens_1.LexerToken.consp;
            case "define":
                return LexerTokens_1.LexerToken.define;
            case "define-macro":
                return LexerTokens_1.LexerToken.defMacro;
            case "null":
                return LexerTokens_1.LexerToken.null;
            default:
                return LexerTokens_1.LexerToken.Iden;
        }
    }
    /**
     * Load string in "". Current not used so maybe remove it
     * @private
     */
    loadString() {
        let currChar = this.getNextChar();
        let res = "";
        while (currChar != "\"") {
            res += currChar;
            currChar = this.getNextChar();
        }
        this.lastChar = null;
        this.currIdentifier = res;
        return LexerTokens_1.LexerToken.Str;
    }
    /**
     * Load identifier and stores it in currIdentifier variable
     * @param result - first letter of the identifier
     * @private
     */
    loadIdentifier(result) {
        let currChar = this.getNextChar();
        let currDataType = Lexer.getTokenType(currChar);
        while (currDataType == TokenType_1.TokenType.NUMBER || currDataType == TokenType_1.TokenType.IDENTIFIER || currChar == "-" || currChar == "_") {
            result += currChar;
            currChar = this.getNextChar();
            currDataType = Lexer.getTokenType(currChar);
        }
        this.currIdentifier = result;
        this.lastChar = currChar;
        return Lexer.loadKeywordToken(result);
    }
    /**
     * Loads special character lexer token
     * @param currChar  - first letter of the token
     * @private
     */
    loadSpecial(currChar) {
        switch (currChar) {
            case "+":
                return LexerTokens_1.LexerToken.plus;
            case "-":
                return LexerTokens_1.LexerToken.minus;
            case "*":
                return LexerTokens_1.LexerToken.times;
            case "/":
                return LexerTokens_1.LexerToken.division;
            case "<":
                currChar = this.getNextChar();
                if (currChar == "=") {
                    this.currIdentifier += currChar;
                    return LexerTokens_1.LexerToken.le;
                }
                this.lastChar = currChar;
                return LexerTokens_1.LexerToken.lt;
            case "=":
                return LexerTokens_1.LexerToken.eq;
            case ">":
                currChar = this.getNextChar();
                if (currChar == "=") {
                    this.currIdentifier += currChar;
                    return LexerTokens_1.LexerToken.he;
                }
                this.lastChar = currChar;
                return LexerTokens_1.LexerToken.ht;
            case "(":
                return LexerTokens_1.LexerToken.leftBracket;
            case ")":
                return LexerTokens_1.LexerToken.rightBracket;
            case "'":
                return LexerTokens_1.LexerToken.quote;
            case "`":
                return LexerTokens_1.LexerToken.backQuote;
            case ",":
                return LexerTokens_1.LexerToken.comma;
            case "#":
                currChar = this.getNextChar();
                this.currIdentifier += currChar;
                if (currChar == "t") {
                    this.currVal = 1;
                    return LexerTokens_1.LexerToken.Bool;
                }
                else if (currChar == "f") {
                    this.currVal = 0;
                    return LexerTokens_1.LexerToken.Bool;
                }
                throw new LexerErrors_1.LexerError("Lexer does not expect " + currChar + "after #.");
            case "\"":
                this.getNextToken();
                return LexerTokens_1.LexerToken.Str;
            default:
                throw new LexerErrors_1.LexerError("Lexer does not support" + currChar);
        }
    }
    /**
     * Get next lexer token
     */
    getNextToken() {
        let currChar = this.loadFirstChar();
        let currDataType;
        this.lastChar = null;
        if (!currChar)
            return LexerTokens_1.LexerToken.end;
        this.currIdentifier = currChar;
        currDataType = Lexer.getTokenType(currChar);
        switch (currDataType) {
            case TokenType_1.TokenType.NUMBER:
                return this.loadNumber(Number(currChar));
            case TokenType_1.TokenType.IDENTIFIER:
                return this.loadIdentifier(currChar);
            case TokenType_1.TokenType.SPEC:
                return this.loadSpecial(currChar);
            case TokenType_1.TokenType.STRING:
                return this.loadString();
            default: //If loaded just whitespaces
                return LexerTokens_1.LexerToken.end;
        }
    }
    getCurrNumber() {
        return this.currVal;
    }
    getCurrString() {
        return this.currIdentifier;
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=Lexer.js.map