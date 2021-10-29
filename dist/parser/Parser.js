"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const LexerTokens_1 = require("../lexer/LexerTokens");
const Lexer_1 = require("../lexer/Lexer");
const Instructions_1 = require("../instructions/Instructions");
const SymbTable_1 = require("./SymbTable");
const SECDArray_1 = require("./SECDArray");
class Parser {
    constructor() {
        this.symbTable = new SymbTable_1.SymbTable([]);
    }
    compare(tok) {
        if (this.currTok == tok)
            this.currTok = this.lexer.getNextToken();
        //else ParserError
    }
    push(arr, val) {
        if (val == null)
            return -2;
        return this.isEvaluating() ? arr.push(val) : -1;
    }
    isEvaluating() {
        return this.lexer.isEvaluating;
    }
    parse(input) {
        this.lexer = new Lexer_1.Lexer(input);
        return this.loadInstructions();
    }
    loadInstructions() {
        this.currTok = this.lexer.getNextToken();
        let res = new SECDArray_1.SECDArray();
        while (true) {
            switch (this.currTok) {
                case LexerTokens_1.LexerToken.quote:
                case LexerTokens_1.LexerToken.null:
                case LexerTokens_1.LexerToken.Iden:
                case LexerTokens_1.LexerToken.Str:
                case LexerTokens_1.LexerToken.Bool:
                case LexerTokens_1.LexerToken.Num:
                case LexerTokens_1.LexerToken.leftBracket:
                    res = res.concat(this.topLevel());
                    break;
                case null:
                    return res;
            }
        }
    }
    topLevel() {
        let res = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                res = this.definition();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                break;
            case LexerTokens_1.LexerToken.quote:
            case LexerTokens_1.LexerToken.null:
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.Str:
            case LexerTokens_1.LexerToken.Bool:
            case LexerTokens_1.LexerToken.Num:
                res = this.val();
                break;
        }
        return res;
    }
    definition() {
        let res = new SECDArray_1.SECDArray();
        let args;
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.define:
                this.compare(LexerTokens_1.LexerToken.define);
                this.symbTable.add(this.lexer.getCurrString());
                this.compare(LexerTokens_1.LexerToken.Iden);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = this.lambda(args);
                res.push(Instructions_1.Instruction[Instructions_1.Instruction.DEFUN]);
                break;
            case LexerTokens_1.LexerToken.defBasicMacro: //TODO
                this.compare(LexerTokens_1.LexerToken.defBasicMacro);
                this.symbTable.add(this.lexer.getCurrString());
                this.compare(LexerTokens_1.LexerToken.Iden);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = this.lambda(args);
                break;
            case LexerTokens_1.LexerToken.defHygMacro: //TODO
                this.compare(LexerTokens_1.LexerToken.defHygMacro);
                this.iden();
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                this.args();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                this.expr();
                break;
            case LexerTokens_1.LexerToken.struct: //TODO
                this.compare(LexerTokens_1.LexerToken.struct);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                this.iden();
                this.args();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                break;
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.let:
            case LexerTokens_1.LexerToken.letrec:
            case LexerTokens_1.LexerToken.lambda:
            case LexerTokens_1.LexerToken.if:
            case LexerTokens_1.LexerToken.plus:
            case LexerTokens_1.LexerToken.minus:
            case LexerTokens_1.LexerToken.times:
            case LexerTokens_1.LexerToken.division:
            case LexerTokens_1.LexerToken.consp:
            case LexerTokens_1.LexerToken.car:
            case LexerTokens_1.LexerToken.cdr:
            case LexerTokens_1.LexerToken.le:
            case LexerTokens_1.LexerToken.lt:
            case LexerTokens_1.LexerToken.eq:
            case LexerTokens_1.LexerToken.ne:
            case LexerTokens_1.LexerToken.he:
            case LexerTokens_1.LexerToken.ht:
            case LexerTokens_1.LexerToken.and:
            case LexerTokens_1.LexerToken.or:
            case LexerTokens_1.LexerToken.backQuote:
            case LexerTokens_1.LexerToken.comma:
                this.symbTable = this.symbTable.push(new SymbTable_1.SymbTable([]));
                res = this.expr_body();
                this.symbTable.pop();
                break;
        }
        return res;
    }
    expr() {
        let res = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                res = this.expr_body();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                break;
            case LexerTokens_1.LexerToken.backQuote:
                res = this.compileBackQuote();
                break;
            case LexerTokens_1.LexerToken.comma:
                res = this.compileComma();
                break;
            case LexerTokens_1.LexerToken.Str:
            case LexerTokens_1.LexerToken.Num:
            case LexerTokens_1.LexerToken.Bool:
            case LexerTokens_1.LexerToken.null:
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.quote:
                res = this.val();
        }
        return res;
    }
    expr_body() {
        let res = new SECDArray_1.SECDArray();
        let innerArr;
        let args;
        let innerRes;
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.let:
                this.compare(LexerTokens_1.LexerToken.let);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                innerRes = this.letBody();
                res = res.concat(innerRes[1]);
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.CONS]);
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = res.concat(this.lambda(innerRes[0]));
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.AP]);
                break;
            case LexerTokens_1.LexerToken.letrec:
                this.compare(LexerTokens_1.LexerToken.letrec);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.DUM]);
                innerRes = this.letBody();
                res = res.concat(innerRes[1]);
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.CONS]);
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = res.concat(this.lambda(innerRes[0]));
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.RAP]);
                break;
            case LexerTokens_1.LexerToken.lambda:
                this.compare(LexerTokens_1.LexerToken.lambda);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = (this.lambda(args));
                break;
            case LexerTokens_1.LexerToken.if:
                this.compare(LexerTokens_1.LexerToken.if);
                res = this.expr();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.SEL]);
                innerArr = this.expr();
                innerArr.push(Instructions_1.Instruction[Instructions_1.Instruction.JOIN]);
                this.push(res, innerArr);
                innerArr = this.expr();
                innerArr.push(Instructions_1.Instruction[Instructions_1.Instruction.JOIN]);
                this.push(res, innerArr);
                break;
            case LexerTokens_1.LexerToken.begin:
                this.compare(LexerTokens_1.LexerToken.begin);
                res = this.beginBody();
                break;
            case LexerTokens_1.LexerToken.printf: //TODO
                this.compare(LexerTokens_1.LexerToken.printf);
                this.compare(LexerTokens_1.LexerToken.Str);
                this.args();
                break;
            case LexerTokens_1.LexerToken.plus:
                this.compare(LexerTokens_1.LexerToken.plus);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.ADD]);
                break;
            case LexerTokens_1.LexerToken.minus:
                this.compare(LexerTokens_1.LexerToken.minus);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.SUB]);
                break;
            case LexerTokens_1.LexerToken.times:
                this.compare(LexerTokens_1.LexerToken.times);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.MUL]);
                break;
            case LexerTokens_1.LexerToken.division:
                this.compare(LexerTokens_1.LexerToken.division);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.DIV]);
                break;
            case LexerTokens_1.LexerToken.lt:
                this.compare(LexerTokens_1.LexerToken.lt);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.LT]);
                break;
            case LexerTokens_1.LexerToken.le:
                this.compare(LexerTokens_1.LexerToken.le);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.LE]);
                break;
            case LexerTokens_1.LexerToken.eq:
                this.compare(LexerTokens_1.LexerToken.eq);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.EQ]);
                break;
            case LexerTokens_1.LexerToken.he:
                this.compare(LexerTokens_1.LexerToken.he);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.HE]);
                break;
            case LexerTokens_1.LexerToken.ht:
                this.compare(LexerTokens_1.LexerToken.ht);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.HT]);
                break;
            case LexerTokens_1.LexerToken.or:
                this.compare(LexerTokens_1.LexerToken.or);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.OR]);
                break;
            case LexerTokens_1.LexerToken.and:
                this.compare(LexerTokens_1.LexerToken.and);
                res = this.compileBinaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.AND]);
                break;
            case LexerTokens_1.LexerToken.car:
                this.compare(LexerTokens_1.LexerToken.car);
                res = this.compileUnaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.CAR]);
                break;
            case LexerTokens_1.LexerToken.cdr:
                this.compare(LexerTokens_1.LexerToken.cdr);
                res = this.compileUnaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.CDR]);
                break;
            case LexerTokens_1.LexerToken.consp:
                this.compare(LexerTokens_1.LexerToken.consp);
                res = this.compileUnaryOperator();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.CONSP]);
                break;
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.leftBracket:
                res = this.functionCall();
                res = res.concat(Instructions_1.Instruction[Instructions_1.Instruction.AP]);
                break;
        }
        return res;
    }
    val() {
        let res = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.Str: //TODO
                this.compare(LexerTokens_1.LexerToken.Str);
                break;
            case LexerTokens_1.LexerToken.Bool:
                res = this.num();
                this.compare(LexerTokens_1.LexerToken.Bool);
                break;
            case LexerTokens_1.LexerToken.Num:
                res = this.num();
                this.compare(LexerTokens_1.LexerToken.Num);
                break;
            case LexerTokens_1.LexerToken.Iden:
                res = this.iden();
                this.compare(LexerTokens_1.LexerToken.Iden);
                break;
            case LexerTokens_1.LexerToken.null:
                this.compare(LexerTokens_1.LexerToken.null);
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.NIL]);
                break;
            case LexerTokens_1.LexerToken.quote:
                res = this.compileQuote();
                break;
        }
        return res;
    }
    iden() {
        let res = new SECDArray_1.SECDArray();
        this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.LD]);
        this.push(res, this.symbTable.getPos(this.lexer.getCurrString()));
        return res;
    }
    args() {
        let res = [];
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.rightBracket:
                break;
            case LexerTokens_1.LexerToken.dot:
                this.compare(LexerTokens_1.LexerToken.dot);
                this.iden(); //TODO jako dole
                this.args();
                break;
            case LexerTokens_1.LexerToken.Iden:
                res = [this.lexer.getCurrString()];
                this.compare(LexerTokens_1.LexerToken.Iden);
                res = res.concat(this.args());
                break;
        }
        return res;
    }
    letBody() {
        let res = new SECDArray_1.SECDArray();
        let innerArr = new SECDArray_1.SECDArray();
        let args = [];
        let arg;
        let innerRes;
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                arg = this.lexer.getCurrString();
                this.symbTable = this.symbTable.push(new SymbTable_1.SymbTable([arg]));
                this.compare(LexerTokens_1.LexerToken.Iden);
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                res = this.functionCall();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                this.symbTable = this.symbTable.pop();
                innerRes = this.letBody();
                args = innerRes[0];
                innerArr = innerRes[1];
                args.push(arg);
                if (innerArr != null)
                    this.push(res, innerArr);
                break;
            case LexerTokens_1.LexerToken.rightBracket:
                break;
        }
        return [args, res];
    }
    beginBody() {
        let res = new SECDArray_1.SECDArray();
        let innerArr = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                res = this.expr();
                innerArr = this.beginBody();
                if (innerArr != null)
                    res = res.concat(innerArr).concat(Instructions_1.Instruction[Instructions_1.Instruction.POP]);
                break;
            case LexerTokens_1.LexerToken.rightBracket:
                break;
        }
        return res;
    }
    functionCall() {
        let res = new SECDArray_1.SECDArray();
        let innerArr;
        this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.NIL]);
        innerArr = this.expr();
        res = res.concat(this.functionArgs());
        return res.concat(innerArr);
    }
    functionArgs() {
        let res = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
            case LexerTokens_1.LexerToken.null:
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.Str:
            case LexerTokens_1.LexerToken.Bool:
            case LexerTokens_1.LexerToken.Num:
            case LexerTokens_1.LexerToken.quote:
                res = this.expr();
                this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.CONS]);
                res = this.functionArgs().concat(res);
                break;
            case LexerTokens_1.LexerToken.rightBracket:
                break;
        }
        return res;
    }
    num() {
        let res = new SECDArray_1.SECDArray();
        this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.LDC]);
        this.push(res, this.lexer.getCurrNumber());
        return res;
    }
    lambda(args) {
        let res = new SECDArray_1.SECDArray();
        let innerArray;
        this.symbTable = this.symbTable.push(new SymbTable_1.SymbTable(args));
        this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.LDF]);
        innerArray = this.expr();
        innerArray.push(Instructions_1.Instruction[Instructions_1.Instruction.RTN]);
        this.push(res, innerArray);
        this.symbTable = this.symbTable.pop();
        return res;
    }
    compileQuote() {
        let res = new SECDArray_1.SECDArray();
        this.push(res, Instructions_1.Instruction[Instructions_1.Instruction.LDC]);
        this.push(res, this.lexer.loadQuotedValue());
        this.currTok = this.lexer.getNextToken();
        return res;
    }
    compileUnaryOperator() {
        return this.expr();
    }
    compileBinaryOperator() {
        let res = this.expr();
        let innerArr = this.expr();
        return innerArr.concat(res);
    }
    compileBackQuote() {
        this.compare(LexerTokens_1.LexerToken.backQuote);
        return this.compileQuote();
    }
    compileComma() {
        //TODO ParserError
        return new SECDArray_1.SECDArray();
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map