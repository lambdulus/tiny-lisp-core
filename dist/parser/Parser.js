"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const LexerTokens_1 = require("../lexer/LexerTokens");
const Lexer_1 = require("../lexer/Lexer");
const Instruction_1 = require("../utility/instructions/Instruction");
const SymbTable_1 = require("./SymbTable");
const SECDArray_1 = require("../utility/SECD/SECDArray");
const SECDValue_1 = require("../utility/SECD/SECDValue");
const InstructionShortcut_1 = require("../utility/instructions/InstructionShortcut");
const AST_1 = require("../AST/AST");
class Parser {
    constructor() {
        this.symbTable = new SymbTable_1.SymbTable([]);
    }
    get topNode() {
        return this._topNode;
    }
    compare(tok) {
        if (this.currTok == tok)
            this.currTok = this.lexer.getNextToken();
        else
            throw new SyntaxError("Syntax error");
    }
    push(arr, val) {
        if (val == null)
            return -2;
        if (val instanceof SECDArray_1.SECDArray)
            return arr.push(val);
        return arr.push(new SECDValue_1.SECDValue(val));
    }
    parse(input) {
        this.lexer = new Lexer_1.Lexer(input);
        return this.loadInstructions();
    }
    loadInstructions() {
        this.currTok = this.lexer.getNextToken();
        let res = new SECDArray_1.SECDArray(), tmp;
        let functions = Array();
        let lastNode = null;
        while (true) {
            switch (this.currTok) {
                case LexerTokens_1.LexerToken.quote:
                case LexerTokens_1.LexerToken.null:
                case LexerTokens_1.LexerToken.Iden:
                case LexerTokens_1.LexerToken.Str:
                case LexerTokens_1.LexerToken.Bool:
                case LexerTokens_1.LexerToken.Num:
                case LexerTokens_1.LexerToken.leftBracket:
                    if (lastNode != undefined)
                        functions.push(lastNode);
                    tmp = this.topLevel();
                    lastNode = tmp[1];
                    res = res.concat(tmp[0]);
                    break;
                case null:
                    this._topNode = new AST_1.TopNode(lastNode, functions);
                    //res.node = lastNode as InnerNode
                    return res;
                default:
                    throw new SyntaxError("Error while parsing");
            }
        }
    }
    topLevel() {
        let res = new SECDArray_1.SECDArray();
        let resTuple = [new SECDArray_1.SECDArray(), new AST_1.ValueNode(0)];
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                resTuple = this.definition();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                break;
            case LexerTokens_1.LexerToken.quote:
            case LexerTokens_1.LexerToken.null:
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.Str:
            case LexerTokens_1.LexerToken.Bool:
            case LexerTokens_1.LexerToken.Num:
                res = this.val();
                resTuple = [res, res.getNode()];
                break;
        }
        return resTuple;
    }
    definition() {
        let res = new SECDArray_1.SECDArray();
        let args;
        let name;
        let node = new AST_1.ValueNode(0);
        let compositeNode = new AST_1.CompositeNode(Array());
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.define:
                this.compare(LexerTokens_1.LexerToken.define);
                name = this.lexer.getCurrString();
                this.symbTable.addFront(name);
                this.compare(LexerTokens_1.LexerToken.Iden);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args();
                compositeNode = new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg)));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = this.lambda(compositeNode);
                res.initializeNode();
                this.push(res, InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.DEFUN]);
                node = new AST_1.DefineNode(name, new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg))), new AST_1.CallNode(res.getNode().body));
                res.setNode(node);
                break;
            case LexerTokens_1.LexerToken.defBasicMacro: //TODO
                this.compare(LexerTokens_1.LexerToken.defBasicMacro);
                this.symbTable.add(this.lexer.getCurrString());
                this.compare(LexerTokens_1.LexerToken.Iden);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args();
                compositeNode = new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg)));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = this.lambda(compositeNode);
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
                res = this.expr_body();
                node = new AST_1.MainNode(res.getNode());
                break;
        }
        return [res, node];
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
        let innerArr, innerArr2;
        let args;
        let innerRes;
        let node;
        let compositeNode;
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.let:
                this.compare(LexerTokens_1.LexerToken.let);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                innerRes = this.letBody();
                res = res.concat(innerRes[1]);
                this.push(res, InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.CONS]);
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                compositeNode = new AST_1.CompositeNode(innerRes[0].map(arg => new AST_1.VarNode(arg)));
                res = res.concat(this.lambda(compositeNode));
                this.push(res, InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.AP]);
                break;
            case LexerTokens_1.LexerToken.letrec:
                this.compare(LexerTokens_1.LexerToken.letrec);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                innerRes = this.letBody();
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DUM), innerRes[1].getNode()));
                res = res.concat(innerRes[1]);
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), res.getNode()));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                compositeNode = new AST_1.CompositeNode(innerRes[0].map(arg => new AST_1.VarNode(arg)));
                innerArr = this.lambda(compositeNode, true);
                res = res.concat(innerArr);
                node = new AST_1.LetNode(compositeNode, res.getNode(), innerArr.getNode());
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.RAP), innerArr.getNode()));
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.lambda:
                this.compare(LexerTokens_1.LexerToken.lambda);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args();
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = (this.lambda(new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg))), false));
                break;
            case LexerTokens_1.LexerToken.if:
                this.compare(LexerTokens_1.LexerToken.if);
                res = this.expr();
                innerArr = this.expr();
                innerArr2 = this.expr();
                node = new AST_1.IfNode(res.getNode(), innerArr.getNode(), innerArr2.getNode());
                res.push(new SECDValue_1.SECDValue(InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.SEL], node));
                innerArr.push(new SECDValue_1.SECDValue(InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.JOIN], node));
                this.push(res, innerArr);
                innerArr2.push(new SECDValue_1.SECDValue(InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.JOIN], node));
                this.push(res, innerArr2);
                res.node = node;
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
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.ADD);
                break;
            case LexerTokens_1.LexerToken.minus:
                this.compare(LexerTokens_1.LexerToken.minus);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.SUB);
                break;
            case LexerTokens_1.LexerToken.times:
                this.compare(LexerTokens_1.LexerToken.times);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.MUL);
                break;
            case LexerTokens_1.LexerToken.division:
                this.compare(LexerTokens_1.LexerToken.division);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.DIV);
                break;
            case LexerTokens_1.LexerToken.lt:
                this.compare(LexerTokens_1.LexerToken.lt);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.LT);
                break;
            case LexerTokens_1.LexerToken.le:
                this.compare(LexerTokens_1.LexerToken.le);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.LE);
                break;
            case LexerTokens_1.LexerToken.eq:
                this.compare(LexerTokens_1.LexerToken.eq);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.EQ);
                break;
            case LexerTokens_1.LexerToken.he:
                this.compare(LexerTokens_1.LexerToken.he);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.HE);
                break;
            case LexerTokens_1.LexerToken.ht:
                this.compare(LexerTokens_1.LexerToken.ht);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.HT);
                break;
            case LexerTokens_1.LexerToken.or:
                this.compare(LexerTokens_1.LexerToken.or);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.OR);
                break;
            case LexerTokens_1.LexerToken.and:
                this.compare(LexerTokens_1.LexerToken.and);
                res = this.compileBinaryOperator(InstructionShortcut_1.InstructionShortcut.AND);
                break;
            case LexerTokens_1.LexerToken.car:
                this.compare(LexerTokens_1.LexerToken.car);
                res = this.compileUnaryOperator(InstructionShortcut_1.InstructionShortcut.CAR);
                break;
            case LexerTokens_1.LexerToken.cdr:
                this.compare(LexerTokens_1.LexerToken.cdr);
                res = this.compileUnaryOperator(InstructionShortcut_1.InstructionShortcut.CDR);
                break;
            case LexerTokens_1.LexerToken.consp:
                this.compare(LexerTokens_1.LexerToken.consp);
                res = this.compileUnaryOperator(InstructionShortcut_1.InstructionShortcut.CONSP);
                break;
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.leftBracket:
                res = this.functionCall();
                innerArr = new SECDArray_1.SECDArray();
                innerArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.AP), res.getNode().func));
                innerArr.get(0).node = res.node;
                res = res.concat(innerArr);
                break;
        }
        return res;
    }
    val() {
        let res = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.Str:
                res = this.str();
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
                this.push(res, InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.NIL]);
                break;
            case LexerTokens_1.LexerToken.quote:
                res = this.compileQuote();
                break;
        }
        return res;
    }
    iden() {
        let res = new SECDArray_1.SECDArray();
        let node = new AST_1.VarNode(this.lexer.getCurrString());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LD), node));
        let innerArr = this.symbTable.getPos(this.lexer.getCurrString());
        res.push(innerArr);
        res.setNode(node);
        innerArr.get(0).setNode(innerArr.get(1).getNode()); //add node also to first digit
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
                if (!innerArr.empty())
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
                if (innerArr != null) {
                    res = res.concat(innerArr);
                    this.push(res, InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.POP]);
                }
                break;
            case LexerTokens_1.LexerToken.rightBracket:
                break;
        }
        return res;
    }
    functionCall() {
        let res = new SECDArray_1.SECDArray();
        let innerArr, innerArr2;
        innerArr = this.expr();
        innerArr2 = this.functionArgs();
        let node = innerArr2.getNode().items.length == 0
            ? innerArr.getNode()
            : new AST_1.FuncNode(innerArr.getNode(), innerArr2.getNode());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL), node));
        res = res.concat(innerArr2);
        res.node = node; //This is important
        res = res.concat(innerArr);
        return res;
    }
    functionArgs() {
        let tmpArr, res = new SECDArray_1.SECDArray();
        let node = new AST_1.CompositeNode(Array());
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
            case LexerTokens_1.LexerToken.null:
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.Str:
            case LexerTokens_1.LexerToken.Bool:
            case LexerTokens_1.LexerToken.Num:
            case LexerTokens_1.LexerToken.quote:
                tmpArr = this.expr();
                tmpArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), tmpArr.getNode()));
                res = this.functionArgs();
                node = res.getNode();
                res = tmpArr.concat(res);
                node.addItemFront(tmpArr.getNode());
                break;
            case LexerTokens_1.LexerToken.rightBracket:
                node = new AST_1.CompositeNode(Array());
                break;
        }
        res.node = node;
        return res;
    }
    str() {
        let res = new SECDArray_1.SECDArray();
        let node = new AST_1.StringNode(this.lexer.getCurrString());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
        res.push(new SECDValue_1.SECDValue(this.lexer.getCurrString()));
        res.setNode(node);
        return res;
    }
    num() {
        let res = new SECDArray_1.SECDArray();
        let node = new AST_1.ValueNode(this.lexer.getCurrNumber());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
        res.push(new SECDValue_1.SECDValue(this.lexer.getCurrNumber()));
        res.setNode(node);
        return res;
    }
    lambda(args, isCall) {
        let res = new SECDArray_1.SECDArray();
        let innerArray;
        this.symbTable = this.symbTable.push(new SymbTable_1.SymbTable(args.items.map(item => item.variable)));
        innerArray = this.expr();
        let node = isCall ? innerArray.getNode() : new AST_1.LambdaNode(args, innerArray.getNode());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDF), node));
        this.push(innerArray, InstructionShortcut_1.InstructionShortcut[InstructionShortcut_1.InstructionShortcut.RTN]);
        innerArray.setNode(node);
        this.push(res, innerArray);
        this.symbTable = this.symbTable.pop();
        return res;
    }
    compileQuote() {
        let res = new SECDArray_1.SECDArray();
        let arr = this.lexer.loadQuotedValue();
        let node = arr.toListNode();
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
        this.createNode(arr);
        this.push(res, arr);
        res.setNode(node);
        this.currTok = this.lexer.getNextToken();
        return res;
    }
    compileUnaryOperator(instructionShortcut) {
        let res = this.expr();
        let node = new AST_1.UnaryExprNode(res.getNode(), new AST_1.OperatorNode(instructionShortcut));
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(instructionShortcut), node));
        res.setNode(node);
        return res;
    }
    compileBinaryOperator(instructionShortcut) {
        let res = this.expr();
        let innerArr = this.expr();
        let node1 = res.getNode();
        let node2 = innerArr.getNode();
        res = innerArr.concat(res);
        let node = new AST_1.BinaryExprNode(node1, node2, new AST_1.OperatorNode(instructionShortcut));
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(instructionShortcut), node));
        res.setNode(node);
        return res;
    }
    compileBackQuote() {
        this.compare(LexerTokens_1.LexerToken.backQuote);
        return this.compileQuote();
    }
    compileComma() {
        return new SECDArray_1.SECDArray();
    }
    createNode(element) {
        if (element instanceof SECDArray_1.SECDArray) {
            let node = new AST_1.CompositeNode(element.map(element => this.createNode(element)));
            element.node = node;
            return node;
        }
        if (element instanceof SECDValue_1.SECDValue) {
            if (typeof (element.val) == "number") {
                let node = new AST_1.ValueNode(element.val);
                element.setNode(node);
                return node;
            }
        }
        return new AST_1.ValueNode(0); //TODO Throw something
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map