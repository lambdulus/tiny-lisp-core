"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const DataTypes_1 = require("./DataTypes");
const LexerTokens_1 = require("./LexerTokens");
const SECDArray_1 = require("../utility/SECD/SECDArray");
const SECDValue_1 = require("../utility/SECD/SECDValue");
const LexerErrors_1 = require("./LexerErrors");
class Lexer {
    constructor(input) {
        this.inputBuffer = input;
        this.lastChar = null;
        this.currVal = 0;
        this.currIdentifier = "";
    }
    getNextChar() {
        if (this.inputBuffer) {
            const result = this.inputBuffer.charAt(0);
            this.inputBuffer = this.inputBuffer.substring(1);
            return result;
        }
        return null;
    }
    loadNonWhitespace() {
        let res = this.getNextChar();
        if (!res)
            return null;
        if (Lexer.getDataType(res) == DataTypes_1.DataType.WHITESPACE)
            return this.loadNonWhitespace();
        return res;
    }
    loadFirstChar() {
        let dataType = Lexer.getDataType(this.lastChar);
        return (dataType == DataTypes_1.DataType.INVALID || dataType == DataTypes_1.DataType.WHITESPACE)
            ? this.loadNonWhitespace() : this.lastChar;
    }
    static getDataType(char) {
        if (!char)
            return DataTypes_1.DataType.INVALID;
        if (char == "\"")
            return DataTypes_1.DataType.STRING;
        if (char.match(/[0-9]/i))
            return DataTypes_1.DataType.NUMBER;
        else if (char.match(/[a-z]|[A-Z]/i))
            return DataTypes_1.DataType.IDENTIFIER;
        else if (!/\S/.test(char)) {
            return DataTypes_1.DataType.WHITESPACE;
        }
        return DataTypes_1.DataType.SPEC;
    }
    loadNumber(result) {
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType == DataTypes_1.DataType.NUMBER) {
            result = result * 10 + Number(currChar);
            currChar = this.getNextChar();
            currDataType = Lexer.getDataType(currChar);
        }
        this.lastChar = currChar;
        this.currIdentifier = result.toString();
        this.currVal = result;
        return LexerTokens_1.LexerToken.Num;
    }
    static loadIdenToken(str) {
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
            case "consp":
                return LexerTokens_1.LexerToken.consp;
            case "define":
                return LexerTokens_1.LexerToken.define;
            case "def-macro":
                return LexerTokens_1.LexerToken.defBasicMacro;
            default:
                return LexerTokens_1.LexerToken.Iden;
        }
    }
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
    loadIdentifier(result) {
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType == DataTypes_1.DataType.NUMBER || currDataType == DataTypes_1.DataType.IDENTIFIER || currChar == "-" || currChar == "_") {
            result += currChar;
            currChar = this.getNextChar();
            currDataType = Lexer.getDataType(currChar);
        }
        this.currIdentifier = result;
        this.lastChar = currChar;
        return Lexer.loadIdenToken(result);
    }
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
            case ".":
                return LexerTokens_1.LexerToken.dot;
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
                throw new LexerErrors_1.LexerError("Invalid lexer input");
            case "\"":
                this.getNextToken();
                return LexerTokens_1.LexerToken.Str;
            default:
                throw new LexerErrors_1.LexerError("Invalid lexer input");
        }
    }
    loadListAsSECDArray() {
        let res = new SECDArray_1.SECDArray();
        let currChar;
        while (true) {
            currChar = this.loadFirstChar();
            if (!currChar)
                throw new LexerErrors_1.LexerError("Invalid lexer input");
            switch (currChar) {
                case "(":
                    res.push(this.loadListAsSECDArray());
                    break;
                case ")":
                    this.lastChar = null;
                    return res;
                default:
                    this.lastChar = currChar;
                    let token = this.getNextToken();
                    if (token == LexerTokens_1.LexerToken.false) {
                        res.push(new SECDValue_1.SECDValue(0));
                        break;
                    }
                    else if (token == LexerTokens_1.LexerToken.true) {
                        res.push(new SECDValue_1.SECDValue(1));
                        break;
                    }
                    else if (token == LexerTokens_1.LexerToken.Str) {
                        res.push(new SECDValue_1.SECDValue(this.currIdentifier));
                        this.lastChar = null;
                        break;
                    }
                    res.push(new SECDValue_1.SECDValue(this.getCurrNumber()));
                    break;
                //res.push(new SECDValue(this.loadQuotedElement(currChar)))
            }
        }
    }
    loadQuotedElement(currChar) {
        this.lastChar = currChar;
        this.getNextToken();
        switch (Lexer.getDataType(currChar)) {
            case DataTypes_1.DataType.NUMBER:
                return this.getCurrNumber().toString();
            case DataTypes_1.DataType.IDENTIFIER:
            case DataTypes_1.DataType.SPEC:
                return this.getCurrString();
            case DataTypes_1.DataType.WHITESPACE:
            default:
                throw new LexerErrors_1.LexerError("Invalid lexer input");
        }
    }
    loadQuotedValue() {
        let currChar = this.loadFirstChar();
        this.lastChar = null;
        if (currChar != "(") {
            let res = new SECDArray_1.SECDArray();
            res.push(new SECDValue_1.SECDValue(this.loadQuotedElement(currChar)));
            return res;
        }
        return this.loadListAsSECDArray();
    }
    getNextToken() {
        let currChar = this.loadFirstChar();
        let currDataType;
        this.lastChar = null;
        if (!currChar)
            return null;
        this.currIdentifier = currChar;
        currDataType = Lexer.getDataType(currChar);
        switch (currDataType) {
            case DataTypes_1.DataType.NUMBER:
                return this.loadNumber(Number(currChar));
            case DataTypes_1.DataType.IDENTIFIER:
                return this.loadIdentifier(currChar);
            case DataTypes_1.DataType.SPEC:
                return this.loadSpecial(currChar);
            case DataTypes_1.DataType.STRING:
                return this.loadString();
            default:
                return null;
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