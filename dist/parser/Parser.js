"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LexerTokens_1 = require("../lexer/LexerTokens");
const Lexer_1 = require("../lexer/Lexer");
const Instruction_1 = require("../SECD/instructions/Instruction");
const SymbTable_1 = require("./SymbTable");
const SECDArray_1 = require("../SECD/SECDArray");
const SECDValue_1 = require("../SECD/SECDValue");
const InstructionShortcut_1 = require("../SECD/instructions/InstructionShortcut");
const AST_1 = require("../AST/AST");
const ParserErrors_1 = require("./ParserErrors");
const LexerTokenUtils_1 = require("../lexer/LexerTokenUtils");
const Interpreter_1 = require("../interpreter/Interpreter");
class Parser {
    constructor() {
        this.symbTable = new SymbTable_1.SymbTable([]);
        this.macros = new Map();
        this.callable = new Map();
        this.quoted = false;
        this.isMacro = false;
        this.definingMacro = false;
        this.currTok = LexerTokens_1.LexerToken.end;
    }
    get topNode() {
        return this._topNode;
    }
    /**
     * Performs ll-parsing compare operation
     * @param tok lexer token
     * @private
     */
    compare(tok) {
        if (this.currTok == tok)
            this.currTok = this.lexer.getNextToken();
        else {
            throw new SyntaxError("Syntax error: Excepted " + LexerTokenUtils_1.LexerTokenUtils.toString(this.currTok) + " token but got: " + LexerTokenUtils_1.LexerTokenUtils.toString(tok));
        }
    }
    /**
     * compile and parse source code
     * @param sourceCode source code
     * @param args
     */
    parse(sourceCode, args = new SymbTable_1.SymbTable([])) {
        this.lexer = new Lexer_1.Lexer(sourceCode);
        this.symbTable = args;
        let res = this.loadInstructions();
        return res;
    }
    /**
     * inner method to compile and parse source code
     * @private
     */
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
                case LexerTokens_1.LexerToken.backQuote:
                    if (lastNode != undefined)
                        functions.push(lastNode);
                    tmp = this.topLevel();
                    lastNode = tmp[1];
                    res = res.concat(tmp[0]);
                    break;
                case LexerTokens_1.LexerToken.end:
                    this._topNode = new AST_1.TopNode(lastNode, functions);
                    res.node = lastNode; //TODO maybe erase the node completely
                    return res;
                default:
                    throw new SyntaxError("Error while parsing");
            }
        }
    }
    /**
     * Compiles next top level definition
     * @private
     */
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
            case LexerTokens_1.LexerToken.backQuote:
                res = this.val();
                resTuple = [res, res.getNode()];
                break;
        }
        return resTuple;
    }
    /**
     * Compiles top statement definition
     * @private
     */
    definition() {
        let res = new SECDArray_1.SECDArray(), arr = new SECDArray_1.SECDArray();
        let args;
        let name;
        let node = new AST_1.ValueNode(0);
        let callNode;
        let compositeNode = new AST_1.CompositeNode(Array());
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.define:
                this.compare(LexerTokens_1.LexerToken.define);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                name = this.lexer.getCurrString();
                this.compare(LexerTokens_1.LexerToken.Iden);
                args = this.args();
                this.symbTable.addFront(name, args.length);
                compositeNode = new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg)));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = this.lambda(compositeNode, 2);
                res.initializeNode(); //Move node level above in array
                node = new AST_1.DefineNode(name, new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg))), res.getNode());
                this.callable.set(name, res);
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DEFUN), node));
                res.get(0).node = node;
                res.get(1).node = node;
                arr = res.get(1);
                arr.get(arr.length() - 1).node = node; //SET RTN instruction to Define node
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.defMacro:
                this.definingMacro = true;
                this.compare(LexerTokens_1.LexerToken.defMacro);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                name = this.lexer.getCurrString();
                this.compare(LexerTokens_1.LexerToken.Iden);
                args = this.args();
                this.symbTable.addFront(name, args.length);
                compositeNode = new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg)));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                this.isMacro = true;
                res = (this.lambda(compositeNode, 3));
                node = new AST_1.DefineNode(name, new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg))), res.getNode(), true);
                this.isMacro = false;
                this.macros.set(name, res); //add code to the macro map
                this.callable.set(name, res); //add code to the map of all callables
                res = new SECDArray_1.SECDArray();
                res.node = node;
                this.definingMacro = false;
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
            case LexerTokens_1.LexerToken.cons:
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
            case LexerTokens_1.LexerToken.begin:
            case LexerTokens_1.LexerToken.leftBracket:
                res = this.expr_body();
                node = new AST_1.MainNode(res.getNode());
                break;
        }
        return [res, node];
    }
    /**
     *
     * @param isMacroCall - true if it is call of macro
     * @param boundVar - it is name of the bound variable if this is body of the bound expression in let, otherwise null
     * @private
     */
    expr(isMacroCall = false, boundVar = null) {
        let res = new SECDArray_1.SECDArray(), tmpArr = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                if (this.quoted) {
                    tmpArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
                    tmpArr = tmpArr.concat(this.functionArgs(false));
                    res = tmpArr.concat(res);
                    res.get(0).node = tmpArr.node;
                }
                else if (isMacroCall) {
                    res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC)));
                    res.push(this.expr_body(boundVar));
                    res.get(0).node = res.node;
                }
                else {
                    res = this.expr_body(boundVar);
                }
                this.compare(LexerTokens_1.LexerToken.rightBracket);
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
            case LexerTokens_1.LexerToken.backQuote:
                res = this.val();
                break;
            case LexerTokens_1.LexerToken.let:
            case LexerTokens_1.LexerToken.letrec:
            case LexerTokens_1.LexerToken.lambda:
            case LexerTokens_1.LexerToken.if:
            case LexerTokens_1.LexerToken.begin:
            case LexerTokens_1.LexerToken.plus:
            case LexerTokens_1.LexerToken.minus:
            case LexerTokens_1.LexerToken.times:
            case LexerTokens_1.LexerToken.division:
            case LexerTokens_1.LexerToken.lt:
            case LexerTokens_1.LexerToken.le:
            case LexerTokens_1.LexerToken.eq:
            case LexerTokens_1.LexerToken.he:
            case LexerTokens_1.LexerToken.ht:
            case LexerTokens_1.LexerToken.or:
            case LexerTokens_1.LexerToken.and:
            case LexerTokens_1.LexerToken.car:
            case LexerTokens_1.LexerToken.cdr:
            case LexerTokens_1.LexerToken.cons:
            case LexerTokens_1.LexerToken.consp:
                if (this.quoted) { //If quoted, load quoted name of the keyword
                    let node = new AST_1.QuoteNode(new AST_1.StringNode(this.lexer.currIdentifier));
                    res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
                    res.push(new SECDValue_1.SECDValue(this.lexer.currIdentifier, node));
                    this.currTok = this.lexer.getNextToken();
                    break;
                }
            default:
                throw new ParserErrors_1.ParserError("Unexpected token: " + LexerTokenUtils_1.LexerTokenUtils.toString(this.currTok));
        }
        return res;
    }
    /**
     * Compiles body of the expression
     * @param boundVar - it is name of the bound variable if this is body of the bound expression in let, otherwise null
     * @private
     */
    expr_body(boundVar = null) {
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
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
                res = res.concat(innerRes[1]);
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                compositeNode = new AST_1.CompositeNode(innerRes[0].map(arg => new AST_1.VarNode(arg)));
                innerArr = this.lambda(compositeNode, 1);
                res = res.concat(innerArr);
                node = new AST_1.LetNode(res.getNode(), innerArr.getNode(), false);
                res.get(0).node = node;
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.AP), innerArr.getNode()));
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.letrec:
                this.compare(LexerTokens_1.LexerToken.letrec);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                innerRes = this.letBody();
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DUM)));
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
                res = res.concat(innerRes[1]);
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                compositeNode = new AST_1.CompositeNode(innerRes[0].map(arg => new AST_1.VarNode(arg)));
                innerArr = this.lambda(compositeNode, 1);
                res = res.concat(innerArr);
                node = new AST_1.LetNode(res.getNode(), innerArr.getNode(), true);
                res.get(0).node = node;
                res.get(1).node = node;
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.RAP), innerArr.getNode()));
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.lambda:
                this.compare(LexerTokens_1.LexerToken.lambda);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args();
                if (boundVar) //If this lambda is binded to a variable add the variable to symbTable with number of args of this lambda
                    this.symbTable.add(boundVar, args.length);
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = (this.lambda(new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg)))));
                break;
            case LexerTokens_1.LexerToken.if:
                this.compare(LexerTokens_1.LexerToken.if);
                res = this.expr();
                innerArr = this.expr();
                innerArr2 = this.expr();
                node = new AST_1.IfNode(res.getNode(), innerArr.getNode(), innerArr2.getNode());
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.SEL), node));
                innerArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.JOIN), node));
                res.push(innerArr);
                innerArr2.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.JOIN), node));
                res.push(innerArr2);
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.begin:
                this.compare(LexerTokens_1.LexerToken.begin);
                res = this.beginBody();
                res.node = new AST_1.BeginNode(res.node);
                break;
            case LexerTokens_1.LexerToken.cons:
                this.compare(LexerTokens_1.LexerToken.cons);
                innerArr = this.expr(); //First argument
                let firstArgNode = innerArr.getNode();
                res = res.concat(innerArr);
                let operatorNode = new AST_1.OperatorNode(InstructionShortcut_1.InstructionShortcut.CONS);
                innerArr = this.expr(); //Second argument
                let secondArgNode = innerArr.getNode();
                node = new AST_1.BinaryExprNode(firstArgNode, secondArgNode, operatorNode);
                res.get(0).node = node;
                res.setNode(node);
                res = res.concat(innerArr);
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), innerArr.node));
                break;
            case LexerTokens_1.LexerToken.plus:
            case LexerTokens_1.LexerToken.minus:
            case LexerTokens_1.LexerToken.times:
            case LexerTokens_1.LexerToken.division:
            case LexerTokens_1.LexerToken.lt:
            case LexerTokens_1.LexerToken.le:
            case LexerTokens_1.LexerToken.eq:
            case LexerTokens_1.LexerToken.he:
            case LexerTokens_1.LexerToken.ht:
            case LexerTokens_1.LexerToken.or:
            case LexerTokens_1.LexerToken.and:
                res = this.compileBinaryOperator(this.getOperator());
                break;
            case LexerTokens_1.LexerToken.car:
            case LexerTokens_1.LexerToken.cdr:
            case LexerTokens_1.LexerToken.consp:
                res = this.compileUnaryOperator(this.getOperator());
                break;
            case LexerTokens_1.LexerToken.Str:
            case LexerTokens_1.LexerToken.Num:
            case LexerTokens_1.LexerToken.Bool:
            case LexerTokens_1.LexerToken.null:
            case LexerTokens_1.LexerToken.Iden:
            case LexerTokens_1.LexerToken.quote:
                if (this.quoted) {
                    res = this.val();
                    break;
                }
                if (this.currTok !== LexerTokens_1.LexerToken.Iden)
                    throw new ParserErrors_1.ParserError("Expected function name");
            case LexerTokens_1.LexerToken.leftBracket:
                res = this.functionCall();
                break;
        }
        return res;
    }
    /**
     * Compiles value
     * @param isMacroCall - true if inside of macro call, otherwise false
     * @private
     */
    val(isMacroCall = false) {
        let res = new SECDArray_1.SECDArray();
        if (isMacroCall) {
            if (this.currTok === LexerTokens_1.LexerToken.Num) { //Num is macro does not need to be loaded as string
                res.push(new SECDValue_1.SECDValue(this.lexer.currVal, new AST_1.ValueNode(this.lexer.currVal)));
                this.compare(LexerTokens_1.LexerToken.Num);
            }
            else if (this.currTok === LexerTokens_1.LexerToken.Bool) { //Bool in macro does not need to be loaded as string
                res.push(new SECDValue_1.SECDValue(this.lexer.currVal, new AST_1.ValueNode(this.lexer.currVal)));
                this.compare(LexerTokens_1.LexerToken.Bool);
            }
            else { //Load as string
                res.push(new SECDValue_1.SECDValue(this.lexer.currIdentifier, new AST_1.StringNode(this.lexer.currIdentifier)));
                this.currTok = this.lexer.getNextToken();
            }
        }
        else {
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
                    /*if (this.symbTable.getArgsCnt(this.lexer.currIdentifier) >= 0)
                        throw new ParserError("Use of uncallable identifier")
                    */ res = this.iden();
                    break;
                case LexerTokens_1.LexerToken.null:
                    this.compare(LexerTokens_1.LexerToken.null);
                    res.node = new AST_1.NullNode();
                    break;
                case LexerTokens_1.LexerToken.quote:
                    this.compare(LexerTokens_1.LexerToken.quote);
                    res = this.compileQuote(false);
                    break;
                case LexerTokens_1.LexerToken.backQuote:
                    this.compare(LexerTokens_1.LexerToken.backQuote);
                    res = this.compileQuote(true);
                    break;
                default:
                    throw new ParserErrors_1.ParserError("Unknown lexer token");
            }
        }
        return res;
    }
    /**
     * Compiles identifier
     * @private
     */
    iden() {
        let res = new SECDArray_1.SECDArray();
        let node = new AST_1.VarNode(this.lexer.getCurrString());
        if (this.quoted) {
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
            res.push(new SECDValue_1.SECDValue(this.lexer.getCurrString(), node));
        }
        else {
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LD), node));
            let innerArr = this.symbTable.getPos(this.lexer.getCurrString());
            if (innerArr.get(0).constant < 0 || innerArr.get(1).constant < 0)
                throw new ParserErrors_1.ParserError("Use of undeclared identifier " + this.lexer.getCurrString());
            res.push(innerArr);
            res.setNode(node);
            innerArr.get(0).setNode(innerArr.get(1).getNode()); //add node also to first digit
        }
        this.compare(LexerTokens_1.LexerToken.Iden);
        return res;
    }
    args() {
        let res = [];
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.rightBracket:
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
                this.compare(LexerTokens_1.LexerToken.Iden);
                res = this.expr(false, arg);
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), res.getNode()));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                innerRes = this.letBody();
                args = innerRes[0];
                innerArr = innerRes[1];
                args.push(arg);
                if (!innerArr.empty())
                    res = res.concat(innerArr);
                let exprNode = res.node;
                res.node = innerArr.getNode();
                res.node.addItemFront(new AST_1.BindNode(new AST_1.VarNode(arg), exprNode));
                break;
            case LexerTokens_1.LexerToken.rightBracket:
                res.node = new AST_1.CompositeNode([]);
                break;
        }
        return [args, res];
    }
    /**
     * Compiles expressions inside of the begin statement
     * @private
     */
    beginBody() {
        let res = new SECDArray_1.SECDArray();
        let innerArr = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                res = this.expr(); //Compile expression
                innerArr = this.beginBody(); //Move to next expression
                let exprNode = res.node;
                innerArr.node.addItemFront(exprNode);
                if (!innerArr.empty()) //Last expr is not followed by POP, others are
                    res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.POP), exprNode));
                res = res.concat(innerArr);
                res.node = innerArr.node;
                break;
            case LexerTokens_1.LexerToken.rightBracket:
                res.node = new AST_1.CompositeNode(Array());
                break;
        }
        return res;
    }
    functionCall() {
        let res = new SECDArray_1.SECDArray();
        let innerArr, innerArr2;
        innerArr = this.expr();
        let isMacro = false;
        if (innerArr.node instanceof AST_1.VarNode && this.macros.get(innerArr.node.variable)) { //If it is macro
            innerArr2 = this.functionArgs(true).reverse();
            let marcoByteCode = this.macros.get(innerArr.node.variable); //We are sure node is VarNode and key in map
            let environment = new SECDArray_1.SECDArray();
            let globals = new SECDArray_1.SECDArray();
            environment.push(globals);
            environment.push(innerArr2);
            this.callable.forEach((val, key) => {
                let res = new SECDArray_1.SECDArray();
                res.push(val.get(1));
                res.push(environment);
                globals.push(res);
            }); //Array for global functions
            let interpreter = new Interpreter_1.Interpreter(marcoByteCode, new AST_1.TopNode(marcoByteCode.getNode(), Array()), environment); //Run interpreter with macro arguments as environment
            interpreter.run();
            let evaluated = interpreter.state.stack.get(0);
            let parser = new Parser();
            let reducedMacro = evaluated.print(); //Print list as String
            res = parser.parse(reducedMacro, this.symbTable); //Parse the returned string
            res.node = res.node.node; //Get the node of the parsed expression
        }
        else {
            innerArr2 = this.functionArgs(false);
            let functionArgs;
            let argsCnt = -1;
            innerArr.initializeNode(); //important
            if (innerArr.node instanceof AST_1.VarNode)
                argsCnt = this.symbTable.getArgsCnt(innerArr.node.variable);
            else if (innerArr.node instanceof AST_1.LambdaNode)
                argsCnt = innerArr.node.vars().items().length;
            if (argsCnt < 0)
                throw new ParserErrors_1.ParserError("Use of uncallable identifier");
            if (argsCnt != innerArr2.getNode().items().length)
                throw new ParserErrors_1.ParserError("There are " + argsCnt + " arguments to a function but " + innerArr2.getNode().items().length + " are expected");
            let node = new AST_1.FuncNode(innerArr.node, innerArr2.getNode());
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL), node));
            res = res.concat(innerArr2);
            res.node = node; //This is important
            res = res.concat(innerArr);
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.AP), res.getNode().func()));
            res.get(res.length() - 1).node = res.node;
        }
        return res;
    }
    functionArgs(isMacroCall) {
        let tmpArr = new SECDArray_1.SECDArray(), res = new SECDArray_1.SECDArray();
        let node = new AST_1.CompositeNode(Array());
        if (this.quoted || isMacroCall) {
            switch (this.currTok) {
                case LexerTokens_1.LexerToken.leftBracket:
                    this.compare(LexerTokens_1.LexerToken.leftBracket);
                    let innerArr = this.functionArgs(isMacroCall);
                    if (isMacroCall) {
                        res.push(innerArr); //inner list in list
                    }
                    else {
                        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
                        res = res.concat(innerArr);
                        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), res.node));
                        res.get(0).node = res.node; //Set NIL node to node of the whole arr
                    }
                    this.compare(LexerTokens_1.LexerToken.rightBracket);
                    let otherArgs = this.functionArgs(isMacroCall);
                    node = otherArgs.getNode();
                    res = res.concat(otherArgs);
                    node.addItemFront(innerArr.getNode());
                    break;
                case LexerTokens_1.LexerToken.rightBracket:
                    node = new AST_1.CompositeNode(Array());
                    break;
                default:
                    if (isMacroCall)
                        tmpArr = this.val(isMacroCall); //If macro call
                    else {
                        tmpArr = this.expr(); //If quoted list
                        tmpArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), tmpArr.getNode()));
                    }
                    let valNode = tmpArr.getNode();
                    res = this.functionArgs(isMacroCall);
                    node = res.getNode();
                    res = tmpArr.concat(res);
                    node.addItemFront(valNode);
                    break;
            }
        }
        else {
            switch (this.currTok) {
                case LexerTokens_1.LexerToken.leftBracket:
                case LexerTokens_1.LexerToken.null:
                case LexerTokens_1.LexerToken.Iden:
                case LexerTokens_1.LexerToken.Str:
                case LexerTokens_1.LexerToken.Bool:
                case LexerTokens_1.LexerToken.Num:
                case LexerTokens_1.LexerToken.quote:
                case LexerTokens_1.LexerToken.comma:
                    tmpArr = this.expr(isMacroCall);
                    tmpArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), tmpArr.getNode()));
                    res = this.functionArgs(isMacroCall);
                    node = res.getNode();
                    res = res.concat(tmpArr);
                    node.addItemBack(tmpArr.getNode());
                    break;
                case LexerTokens_1.LexerToken.rightBracket:
                    node = new AST_1.CompositeNode(Array());
                    break;
            }
        }
        res.node = node;
        return res;
    }
    /**
     * Compiles string
     * @private
     */
    str() {
        let res = new SECDArray_1.SECDArray();
        let node = new AST_1.StringNode(this.lexer.getCurrString());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
        res.push(new SECDValue_1.SECDValue(this.lexer.getCurrString()));
        res.setNode(node);
        return res;
    }
    /**
     * Compiles number
     * @private
     */
    num() {
        let res = new SECDArray_1.SECDArray();
        let node = new AST_1.ValueNode(this.lexer.getCurrNumber());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
        res.push(new SECDValue_1.SECDValue(this.lexer.getCurrNumber()));
        res.setNode(node);
        return res;
    }
    /**
     * Compiles lambda function
     * @param args - node containing arguments of the lambda
     * @param isCall
     * @private
     */
    lambda(args, isCall = 0) {
        let res = new SECDArray_1.SECDArray();
        let innerArray;
        this.symbTable = this.symbTable.push(new SymbTable_1.SymbTable(args.items().map(item => item.variable)));
        if (isCall == 3) { //Macros
            let res = this.expr();
            let node = new AST_1.CallNode(res.getNode());
            res.node = node;
            res.get(res.length() - 1);
            res.get(res.length() - 2);
            this.symbTable = this.symbTable.pop();
            return res;
        }
        else {
            innerArray = this.expr();
            let node;
            switch (isCall) {
                case 2: //Functions
                case 1: //Let
                    node = new AST_1.CallNode(innerArray.getNode());
                    break;
                case 0:
                default:
                    node = new AST_1.LambdaNode(args, innerArray.getNode());
                    break;
            }
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDF), node));
            innerArray.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.RTN), node));
            innerArray.setNode(node);
            res.push(innerArray);
            this.symbTable = this.symbTable.pop();
            return res;
        }
    }
    /**
     * Compiles unary operator
     * @param instructionShortcut - shortcut of the operator
     * @private
     */
    compileUnaryOperator(instructionShortcut) {
        let res = this.expr();
        let operatorNode = new AST_1.OperatorNode(instructionShortcut);
        let node = new AST_1.UnaryExprNode(operatorNode, res.getNode());
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(instructionShortcut), operatorNode));
        res.setNode(node);
        return res;
    }
    /**
     * Compiles binary expression
     * @param instructionShortcut - shortcut of the operator
     * @private
     */
    compileBinaryOperator(instructionShortcut) {
        let res = this.expr(); //First argument
        let innerArr = this.expr(); //Second argument
        let firstArgNode = res.getNode();
        let secondArgNode = innerArr.getNode();
        res = innerArr.concat(res);
        let operatorNode = new AST_1.OperatorNode(instructionShortcut);
        let node = new AST_1.BinaryExprNode(firstArgNode, secondArgNode, operatorNode);
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(instructionShortcut), operatorNode));
        res.setNode(node);
        return res;
    }
    /**
     * Compiles quote and the following expression
     * @private
     */
    compileQuote(isBackQuote) {
        this.quoted = true;
        let res = new SECDArray_1.SECDArray();
        res = res.concat(this.expr());
        res.get(0).node = res.getNode();
        this.quoted = false;
        res.node = new AST_1.QuoteNode(res.node, isBackQuote);
        return res;
    }
    /**
     * Compiles comma and the following expression
     * @private
     */
    compileComma() {
        this.compare(LexerTokens_1.LexerToken.comma);
        this.quoted = false;
        let res = this.expr();
        this.quoted = true;
        res.node = new AST_1.CommaNode(res.getNode());
        return res;
    }
    /**
     * Converts currTok of type LexerToken to equivalent InstructionShortcut
     * @private
     */
    getOperator() {
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.plus:
                this.compare(LexerTokens_1.LexerToken.plus);
                return InstructionShortcut_1.InstructionShortcut.ADD;
            case LexerTokens_1.LexerToken.minus:
                this.compare(LexerTokens_1.LexerToken.minus);
                return InstructionShortcut_1.InstructionShortcut.SUB;
            case LexerTokens_1.LexerToken.times:
                this.compare(LexerTokens_1.LexerToken.times);
                return InstructionShortcut_1.InstructionShortcut.MUL;
            case LexerTokens_1.LexerToken.division:
                this.compare(LexerTokens_1.LexerToken.division);
                return InstructionShortcut_1.InstructionShortcut.DIV;
            case LexerTokens_1.LexerToken.lt:
                this.compare(LexerTokens_1.LexerToken.lt);
                return InstructionShortcut_1.InstructionShortcut.LT;
            case LexerTokens_1.LexerToken.le:
                this.compare(LexerTokens_1.LexerToken.le);
                return InstructionShortcut_1.InstructionShortcut.LE;
            case LexerTokens_1.LexerToken.eq:
                this.compare(LexerTokens_1.LexerToken.eq);
                return InstructionShortcut_1.InstructionShortcut.EQ;
            case LexerTokens_1.LexerToken.he:
                this.compare(LexerTokens_1.LexerToken.he);
                return InstructionShortcut_1.InstructionShortcut.HE;
            case LexerTokens_1.LexerToken.ht:
                this.compare(LexerTokens_1.LexerToken.ht);
                return InstructionShortcut_1.InstructionShortcut.HT;
            case LexerTokens_1.LexerToken.or:
                this.compare(LexerTokens_1.LexerToken.or);
                return InstructionShortcut_1.InstructionShortcut.OR;
            case LexerTokens_1.LexerToken.and:
                this.compare(LexerTokens_1.LexerToken.and);
                return InstructionShortcut_1.InstructionShortcut.AND;
            case LexerTokens_1.LexerToken.cons:
                this.compare(LexerTokens_1.LexerToken.cons);
                return InstructionShortcut_1.InstructionShortcut.CONS;
            case LexerTokens_1.LexerToken.car:
                this.compare(LexerTokens_1.LexerToken.car);
                return InstructionShortcut_1.InstructionShortcut.CAR;
            case LexerTokens_1.LexerToken.cdr:
                this.compare(LexerTokens_1.LexerToken.cdr);
                return InstructionShortcut_1.InstructionShortcut.CDR;
            case LexerTokens_1.LexerToken.cons:
                this.compare(LexerTokens_1.LexerToken.cons);
                return InstructionShortcut_1.InstructionShortcut.CONS;
            case LexerTokens_1.LexerToken.consp:
                this.compare(LexerTokens_1.LexerToken.consp);
                return InstructionShortcut_1.InstructionShortcut.CONSP;
            default:
                throw new ParserErrors_1.ParserError("Unknown operator");
        }
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map