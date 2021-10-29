"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const DataTypes_1 = require("./DataTypes");
const LexerTokens_1 = require("./LexerTokens");
const SECDArray_1 = require("../parser/SECDArray");
class Lexer {
    constructor(input) {
        this.inputBuffer = input;
        this.lastChar = null;
        this.currVal = 0;
        this.currIdentifier = "";
        this.preprocessorStr = "";
        this._isEvaluating = true;
    }
    get isEvaluating() {
        return this._isEvaluating;
    }
    set isEvaluating(value) {
        this._isEvaluating = value;
    }
    resetPreprocessorStr() {
        this.preprocessorStr = this.getCurrString();
        if (this.lastChar)
            this.preprocessorStr += this.lastChar;
    }
    getNextChar() {
        if (this.inputBuffer) {
            const result = this.inputBuffer.charAt(0);
            this.inputBuffer = this.inputBuffer.substring(1);
            if (!this._isEvaluating)
                this.preprocessorStr += result;
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
        if (char.match(/[0-9]/i))
            return DataTypes_1.DataType.NUMBER;
        else if (char.match(/[a-z]|[A-Z]/i))
            return DataTypes_1.DataType.STRING;
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
    loadIdentifier(result) {
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType == DataTypes_1.DataType.NUMBER || currDataType == DataTypes_1.DataType.STRING || currChar == "-" || currChar == "_") {
            result += currChar;
            currChar = this.getNextChar();
            currDataType = Lexer.getDataType(currChar);
        }
        this.currIdentifier = result;
        this.lastChar = currChar;
        return Lexer.loadIdenToken(result);
    }
    /*private loadString(result: string): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getDataType(currChar);
        while (currDataType != DataType.QUOTES)
            result += currChar;
        this.lastChar = currChar;
        this.currIdentifier = result;
        return LexerToken.Str;
    }*/
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
                    return LexerTokens_1.LexerToken.true;
                }
                else if (currChar == "f") {
                    this.currVal = 0;
                    return LexerTokens_1.LexerToken.false;
                }
            default:
                return LexerTokens_1.LexerToken.comma; //LexerError
        }
    }
    loadListAsSECDArray() {
        let res = new SECDArray_1.SECDArray();
        let currChar;
        while (true) {
            currChar = this.loadFirstChar();
            if (!currChar)
                return new SECDArray_1.SECDArray(); //TODO Lexer Error
            switch (currChar) {
                case "(":
                    res.push(this.loadListAsSECDArray());
                    break;
                case ")":
                    this.lastChar = null;
                    return res;
                default:
                    res.push(this.loadQuotedElement(currChar));
            }
        }
    }
    /*
        public loadListAsString(): string{
            let res: string = "";
            let currChar: string;
            let arrCnt = 0;
            while(true){
                currChar = this.loadFirstChar();
                if(!currChar)
                    return; //TODO Lexer Error
                res += currChar;
                switch(currChar){
                    case "(":
                        arrCnt ++;
                        break;
                    case ")":
                        if((-- arrCnt) == 0)
                            return res;
                }
            }
        }*/
    loadQuotedElement(currChar) {
        this.lastChar = currChar;
        this.getNextToken();
        switch (Lexer.getDataType(currChar)) {
            case DataTypes_1.DataType.NUMBER:
                return this.getCurrNumber().toString();
            case DataTypes_1.DataType.STRING:
            case DataTypes_1.DataType.SPEC:
                return this.getCurrString();
            case DataTypes_1.DataType.WHITESPACE:
            default:
                return ""; //LexerError
        }
    }
    loadQuotedValue() {
        let currChar = this.loadFirstChar();
        this.lastChar = null;
        if (currChar != "(") {
            let res = new SECDArray_1.SECDArray();
            res.push(this.loadQuotedElement(currChar));
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
            /*case DataType.QUOTES:
                return this.loadString("");*/
            case DataTypes_1.DataType.STRING:
                return this.loadIdentifier(currChar);
            case DataTypes_1.DataType.SPEC:
                return this.loadSpecial(currChar);
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
    getPreprocessorString() {
        let res = this.preprocessorStr;
        this.preprocessorStr = "";
        if (this.lastChar)
            res += this.lastChar;
        return res;
    }
}
exports.Lexer = Lexer;
//# sourceMappingURL=Lexer.js.map