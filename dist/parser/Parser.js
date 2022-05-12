"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
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
var FuncType;
(function (FuncType) {
    FuncType[FuncType["LAMBDA"] = 0] = "LAMBDA";
    FuncType[FuncType["LET"] = 1] = "LET";
    FuncType[FuncType["GLOBAL"] = 2] = "GLOBAL";
    FuncType[FuncType["MACRO"] = 3] = "MACRO";
})(FuncType || (FuncType = {}));
class Parser {
    constructor() {
        this.symbTable = new SymbTable_1.SymbTable([]);
        this.macros = new Map();
        this.callable = new Map();
        this.quoted = false;
        this.isMacro = false;
        this.currTok = LexerTokens_1.LexerToken.end;
        this.letBodys = Array();
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
    parse(sourceCode, args = new SymbTable_1.SymbTable([]), isMacroExpansion = false) {
        this.symbTable = args;
        this.lexer = new Lexer_1.Lexer(sourceCode, isMacroExpansion); //create lexer
        let res = this.loadInstructions(); //compile
        return res;
    }
    /**
     * inner method to compile and parse source code
     * @private
     */
    loadInstructions() {
        this.currTok = this.lexer.getNextToken();
        let res = new SECDArray_1.SECDArray(), tmp;
        let exprs = Array();
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
                        exprs.push(lastNode);
                    tmp = this.topLevel();
                    lastNode = tmp[1];
                    res = res.concat(tmp[0]);
                    break;
                case LexerTokens_1.LexerToken.end:
                    exprs.push(lastNode);
                    this._topNode = new AST_1.TopNode(exprs);
                    res.node = lastNode;
                    return res;
                default:
                    throw new SyntaxError("Unexpected top level statement");
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
                res = this.val(); //If val without brackets
                resTuple = [res, res.node];
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
                name = this.lexer.getCurrString(); //name of the function
                this.compare(LexerTokens_1.LexerToken.Iden);
                args = this.args(); //parameters of the function
                this.symbTable.addFront(name, args.length); //add this fce to symbtable
                compositeNode = new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg)));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = this.lambdaBody(compositeNode, FuncType.GLOBAL);
                node = new AST_1.DefineNode(name, new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg))), res.node);
                this.callable.set(name, res);
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DEFUN), node));
                res.get(0).node = node; //SET LDF to Define node
                res.get(1).node = node; //SET fce body to Define node
                arr = res.get(1);
                arr.get(arr.length() - 1).node = node; //SET RTN instruction to Define node
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.defMacro:
                this.compare(LexerTokens_1.LexerToken.defMacro);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                name = this.lexer.getCurrString();
                this.compare(LexerTokens_1.LexerToken.Iden);
                args = this.args(); //macro args names
                this.symbTable.addFront(name, args.length); //add this macro to symbtable
                compositeNode = new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg)));
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                this.isMacro = true;
                res = new SECDArray_1.SECDArray();
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDF)));
                res.push(this.lambdaBody(compositeNode, FuncType.MACRO));
                res.node = res.get(1).node;
                node = new AST_1.DefineNode(name, new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg))), res.node, true);
                this.isMacro = false;
                this.macros.set(name, res); //add code to the macro map
                this.callable.set(name, res); //add code to the map of all callables
                res = new SECDArray_1.SECDArray();
                res.node = node;
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
                node = new AST_1.MainNode(res.node);
                break;
        }
        return [res, node];
    }
    /**
     *
     * @param isMacroCall - true if it is call of macro
     * @private
     */
    expr(isMacroCall = false) {
        let res = new SECDArray_1.SECDArray(), tmpArr = new SECDArray_1.SECDArray();
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                if (this.quoted) {
                    //load quoted list
                    res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
                    res = res.concat(this.listElements(false));
                    res.get(0).node = tmpArr.node;
                }
                else if (isMacroCall) {
                    //macro arguments are quoted
                    res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC)));
                    res.push(this.expr_body());
                    res.get(0).node = res.node;
                }
                else {
                    res = this.expr_body();
                }
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                break;
            case LexerTokens_1.LexerToken.comma:
                if (this.quoted)
                    res = this.compileComma();
                else
                    throw new ParserErrors_1.ParserError("Comma used outside of a list");
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
                    res.node = node;
                    this.currTok = this.lexer.getNextToken(); //We did not get new token from compare so we need to do this
                    break;
                }
            default:
                throw new ParserErrors_1.ParserError("Unexpected token: " + LexerTokenUtils_1.LexerTokenUtils.toString(this.currTok));
        }
        return res;
    }
    /**
     * Compiles body of the expression
     * @private
     */
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
                innerRes = this.letBindings();
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
                res = res.concat(innerRes[1]); //add compiled code of let expression in bindings
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                compositeNode = new AST_1.CompositeNode(innerRes[0].map(arg => new AST_1.VarNode(arg))); //add variables of bindings to composite node
                innerArr = this.lambdaBody(compositeNode, FuncType.LET); //compile let body
                res = res.concat(innerArr); //add compiled code of bodu
                node = new AST_1.LetNode(res.node, innerArr.node, false);
                res.get(0).node = node;
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.AP), innerArr.node));
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.letrec:
                this.compare(LexerTokens_1.LexerToken.letrec);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                innerRes = this.letBindings();
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DUM)));
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
                res = res.concat(innerRes[1]); //add compiled code of let expression in bindings
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                compositeNode = new AST_1.CompositeNode(innerRes[0].map(arg => new AST_1.VarNode(arg))); //add variables of bindings to composite node
                innerArr = this.lambdaBody(compositeNode, FuncType.LET); //compile let body
                res = res.concat(innerArr); //add compiled code of bodu
                node = new AST_1.LetNode(res.node, innerArr.node, true);
                res.get(0).node = node; //DUM
                res.get(1).node = node; //NIL
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.RAP), innerArr.node));
                res.node = node;
                break;
            case LexerTokens_1.LexerToken.lambda:
                this.compare(LexerTokens_1.LexerToken.lambda);
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                args = this.args(); //Lambda args
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                res = this.lambdaBody(new AST_1.CompositeNode(args.map(arg => new AST_1.VarNode(arg))), FuncType.LAMBDA); //body
                break;
            case LexerTokens_1.LexerToken.if:
                this.compare(LexerTokens_1.LexerToken.if);
                res = this.expr(); //condition
                innerArr = this.expr(); //First branch
                innerArr2 = this.expr(); //Second branch
                node = new AST_1.IfNode(res.node, innerArr.node, innerArr2.node);
                //SEL and JOIN instruction all have the ifNode
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
                let firstArgNode = innerArr.node;
                res = innerArr;
                let operatorNode = new AST_1.OperatorNode(InstructionShortcut_1.InstructionShortcut.CONS);
                innerArr = this.expr(); //Second argument
                let secondArgNode = innerArr.node;
                node = new AST_1.BinaryExprNode(firstArgNode, secondArgNode, operatorNode);
                res = res.concat(innerArr); //combine compiled arguments
                res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), operatorNode));
                res.node = node;
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
     * @param isMacroCall - true if inside of a macro call, otherwise false
     * @private
     */
    val(isMacroCall = false) {
        let res = new SECDArray_1.SECDArray();
        if (isMacroCall) {
            if (this.currTok === LexerTokens_1.LexerToken.Num) { //Num is macro does not need to be loaded as string
                let node = new AST_1.ValueNode(this.lexer.currVal);
                res.push(new SECDValue_1.SECDValue(this.lexer.currVal, node));
                res.node = node;
                this.compare(LexerTokens_1.LexerToken.Num);
            }
            else if (this.currTok === LexerTokens_1.LexerToken.Bool) { //Bool in macro does not need to be loaded as string
                let node = new AST_1.ValueNode(this.lexer.currVal);
                res.push(new SECDValue_1.SECDValue(this.lexer.currVal, node));
                res.node = node;
                this.compare(LexerTokens_1.LexerToken.Bool);
            }
            else { //Load as string
                let node = new AST_1.StringNode(this.lexer.currIdentifier);
                res.push(new SECDValue_1.SECDValue(this.lexer.currIdentifier, node));
                res.node = node;
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
                    res = this.iden();
                    break;
                case LexerTokens_1.LexerToken.null:
                    this.compare(LexerTokens_1.LexerToken.null);
                    res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL)));
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
     * Compiles an identifier
     * @private
     */
    iden() {
        let res = new SECDArray_1.SECDArray();
        let node = new AST_1.VarNode(this.lexer.getCurrString());
        if (this.quoted) { //If inside a list, just load the identifier as string
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDC), node));
            res.push(new SECDValue_1.SECDValue(this.lexer.getCurrString(), node));
            res.node = node;
        }
        else {
            //If not quoted compile to LD and indices of the variable in symbtable
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LD), node));
            let innerArr = this.symbTable.getPos(this.lexer.getCurrString()); //get indexes in symbTable
            if (innerArr.get(0).constant < 0 || innerArr.get(1).constant < 0)
                throw new ParserErrors_1.ParserError("Use of undeclared identifier " + this.lexer.getCurrString()); //var was not found
            res.push(innerArr);
            res.node = node;
            innerArr.node = node; //array of indices should have the node
            innerArr.get(0).node = node; //add node also to the first digit
        }
        this.compare(LexerTokens_1.LexerToken.Iden);
        return res;
    }
    /**
     * Loads arguments of a function
     * @private
     */
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
    /**
     * Compiles bindings of let/letrec expression
     * @private
     */
    letBindings() {
        let res = new SECDArray_1.SECDArray(); //result butecode
        let boundedVariables = [];
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                this.compare(LexerTokens_1.LexerToken.leftBracket);
                let varName = this.lexer.getCurrString(); //name of the bound varaible
                this.compare(LexerTokens_1.LexerToken.Iden);
                this.symbTable.add(varName, -2); //We don't node wheather it is a variable or a function
                if (this.currTok == LexerTokens_1.LexerToken.leftBracket) //load the bound expression as string
                    this.letBodys.push('(' + this.lexer.loadExpr(1));
                else
                    this.letBodys.push(this.lexer.loadExpr(0, this.currTok));
                this.currTok = this.lexer.getNextToken(); //The loadExpr method loaded tokens but currTok was not updated
                this.compare(LexerTokens_1.LexerToken.rightBracket);
                return this.letBindings();
            case LexerTokens_1.LexerToken.rightBracket:
                //All variables in bindings were loaded, so now parse the expressions
                let parser = new Parser();
                res.node = new AST_1.CompositeNode([]); //All binding will be put into a composite node
                let scopeVars = [...this.symbTable.getVarsInCurrScope()];
                boundedVariables = scopeVars.slice(-this.letBodys.length);
                let i = 0;
                this.letBodys.forEach(body => {
                    let letExpr = parser.parse(body, this.symbTable, this.lexer.isMacroExpansion); //parse the expression
                    let node = (letExpr.node instanceof AST_1.MainNode) ? letExpr.node.node : letExpr.node; //If parser returns a MainNode, use its body node
                    letExpr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), node));
                    letExpr.node = res.node;
                    res = letExpr.concat(res); //Add binding to the compiled bytecode
                    res.node.addItemBack(new AST_1.BindNode(new AST_1.VarNode(boundedVariables[i++]), node)); //Add binding to the composite node
                });
                this.letBodys = []; //crear the array so it can be filled again
                return [boundedVariables, res];
            default:
                throw new ParserErrors_1.ParserError("Unexpected mistake in a let expression");
        }
    }
    /**
     * Compiles expressions inside of a begin statement
     * @private
     */
    beginBody() {
        let res = new SECDArray_1.SECDArray();
        let innerArr;
        switch (this.currTok) {
            case LexerTokens_1.LexerToken.leftBracket:
                res = this.expr(); //Compile expression
                innerArr = this.beginBody(); //Move to next expression
                let exprNode = res.node;
                innerArr.node.addItemFront(exprNode); // add node of every expression to a composite node
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
        let functionArr = new SECDArray_1.SECDArray(), functionArgs = new SECDArray_1.SECDArray();
        if (this.lexer.getCurrString() == "gensym") { //For gensym, special runtime function on indexes -10, -10 will be called
            functionArr.push(new SECDValue_1.SECDValue(-10));
            functionArr.push(new SECDValue_1.SECDValue(-10));
            let node = new AST_1.VarNode("gensym");
            functionArr.node = node;
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LD), node));
            res.push(functionArr);
            res.node = node;
            this.compare(LexerTokens_1.LexerToken.Iden);
            return res;
        }
        functionArr = this.expr();
        let isMacro = false;
        if (functionArr.node instanceof AST_1.VarNode && this.macros.get(functionArr.node.variable)) { //If it is macro
            this.listElements(true).forEach(element => functionArgs.unshift(element));
            let marcoByteCode = this.macros.get(functionArr.node.variable).get(1); //We are sure node is VarNode and key in map
            let environment = new SECDArray_1.SECDArray(); //prepare environment for SECD VM
            let globals = new SECDArray_1.SECDArray();
            environment.push(globals); //add globals list to environment
            environment.push(functionArgs); //add args of the macro
            //add all functions to array of global functions
            this.callable.forEach((val, key) => {
                let res = new SECDArray_1.SECDArray();
                res.push(environment);
                res.push(val.get(1).reverse());
                res.node = res.get(1).node;
                globals.push(res); //add the function itself to its environment
            });
            let interpreter = new Interpreter_1.Interpreter(marcoByteCode, new AST_1.TopNode(Array(marcoByteCode.node)), environment); //Run interpreter with macro arguments as environment
            interpreter.run();
            let evaluated = interpreter.state.stack.get(0); //get result
            let parser = new Parser();
            let reducedMacro = evaluated.print(); //Print list as String
            res = parser.parse(reducedMacro, this.symbTable, true); //Parse the returned string
            res.node = res.node.node; //Get the node of the parsed expression
        }
        else {
            functionArgs = this.listElements(false);
            let argsCnt = -1;
            if (functionArr.node instanceof AST_1.VarNode) //If function has name, look how many args it take
                argsCnt = this.symbTable.getArgsCnt(functionArr.node.variable);
            else if (functionArr.node instanceof AST_1.LambdaNode) //if local fcw, look on how many args it is called
                argsCnt = functionArr.node.vars().items().length;
            if (argsCnt == -1)
                throw new ParserErrors_1.ParserError("Use of uncallable identifier");
            if (argsCnt >= 0 && argsCnt != functionArgs.node.items().length) //got unexpected number of arguments
                throw new ParserErrors_1.ParserError("There are " + functionArgs.node.items().length + " arguments to a function but " + argsCnt + " are expected");
            let node = new AST_1.ApplicationNode(functionArr.node, functionArgs.node);
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.NIL), node));
            res = res.concat(functionArgs); //add compiled arguments
            res = res.concat(functionArr); //add compiled fce
            res.node = node;
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.AP), res.node));
        }
        return res;
    }
    /**
     * Compiles arguments of a function/macro call or a list, if it is quoted
     * @param isMacroCall
     * @private
     */
    listElements(isMacroCall) {
        let tmpArr = new SECDArray_1.SECDArray(), res = new SECDArray_1.SECDArray();
        let node = new AST_1.CompositeNode(Array());
        if (this.quoted || isMacroCall) { //list
            switch (this.currTok) {
                case LexerTokens_1.LexerToken.leftBracket:
                    this.compare(LexerTokens_1.LexerToken.leftBracket);
                    let innerArr = this.listElements(isMacroCall);
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
                    let otherArgs = this.listElements(isMacroCall);
                    node = otherArgs.node;
                    res = res.concat(otherArgs);
                    node.addItemFront(innerArr.node);
                    break;
                case LexerTokens_1.LexerToken.rightBracket:
                    node = new AST_1.CompositeNode(Array());
                    break;
                default:
                    if (isMacroCall)
                        tmpArr = this.val(isMacroCall); //If macro call
                    else {
                        tmpArr = this.expr(); //If quoted list
                        tmpArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), tmpArr.node));
                    }
                    let valNode = tmpArr.node;
                    res = this.listElements(isMacroCall);
                    node = res.node;
                    res = tmpArr.concat(res);
                    node.addItemFront(valNode);
                    break;
            }
        }
        else { //arguments of fce
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
                    tmpArr.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.CONS), tmpArr.node));
                    res = this.listElements(isMacroCall);
                    node = res.node;
                    res = res.concat(tmpArr);
                    node.addItemFront(tmpArr.node);
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
        res.push(new SECDValue_1.SECDValue(this.lexer.getCurrString(), node));
        res.node = node;
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
        res.push(new SECDValue_1.SECDValue(this.lexer.getCurrNumber(), node));
        res.node = node;
        return res;
    }
    /**
     * Compiles lambda function
     * @param args - node containing arguments of the lambda
     * @param isCall
     * @private
     */
    lambdaBody(args, func) {
        let res = new SECDArray_1.SECDArray();
        let innerArray;
        //if(isCall != 1)//Let statements have their variables alreay in the symbtable
        this.symbTable = this.symbTable.push(new SymbTable_1.SymbTable(args.items().map(item => item.variable)));
        if (func == FuncType.MACRO) { //Macros
            //do not add LDF and RTN to macros
            let res = this.expr();
            let node = new AST_1.CallNode(res.node);
            res.node = node;
            this.symbTable = this.symbTable.pop();
            return res;
        }
        else {
            innerArray = this.expr();
            let node;
            switch (func) {
                case FuncType.GLOBAL: //Functions
                case FuncType.LET: //Let
                    node = new AST_1.CallNode(innerArray.node);
                    break;
                case FuncType.LAMBDA: //lambda
                default:
                    node = new AST_1.LambdaNode(args, innerArray.node);
                    break;
            }
            res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.LDF), node));
            innerArray.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.RTN), node));
            innerArray.node = node;
            res.push(innerArray);
            res.node = node;
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
        let res = this.expr(); //arg
        let operatorNode = new AST_1.OperatorNode(instructionShortcut);
        let node = new AST_1.UnaryExprNode(operatorNode, res.node);
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(instructionShortcut), operatorNode));
        res.node = node;
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
        let firstArgNode = res.node;
        let secondArgNode = innerArr.node;
        res = innerArr.concat(res);
        let operatorNode = new AST_1.OperatorNode(instructionShortcut);
        let node = new AST_1.BinaryExprNode(firstArgNode, secondArgNode, operatorNode);
        res.push(new SECDValue_1.SECDValue(new Instruction_1.Instruction(instructionShortcut), operatorNode));
        res.node = node;
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
        res.get(0).node = res.node; //set node of the NIL instruction to the composite node
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
        res.node = new AST_1.CommaNode(res.node);
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