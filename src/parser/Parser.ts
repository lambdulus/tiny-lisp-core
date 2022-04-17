import {LexerToken} from "../lexer/LexerTokens"
import {Lexer} from "../lexer/Lexer"
import {Instruction} from "../utility/instructions/Instruction"
import {SymbTable} from "./SymbTable"
import {SECDArray} from "../utility/SECD/SECDArray"
import {SECDValue} from "../utility/SECD/SECDValue"
import {InstructionShortcut} from "../utility/instructions/InstructionShortcut"
import {
    BeginNode,
    BinaryExprNode, BindNode, CallNode,
    CommaNode,
    CompositeNode,
    DefineNode,
    FuncNode,
    IfNode,
    InnerNode,
    LambdaNode, LetNode,
    ListNode,
    MacroNode,
    MainNode,
    NullNode,
    OperatorNode,
    QuoteNode,
    StringNode,
    TopNode,
    UnaryExprNode,
    ValueNode,
    VarNode
} from "../AST/AST";
import {SECDElement} from "../utility/SECD/SECDElement";
import { ParserError } from "./ParserErrors"
import { SECDConstant } from "../utility/SECD/SECDConstant"
import { SECDMacro } from "../utility/SECD/SECDMacro"
import { LexerTokenUtils } from "../utility/LexerTokenUtils"
import { Interpreter } from "../interpreter/Interpreter"

/**
 *
 * Parser
 */

export class Parser{
    get topNode(): TopNode | null {
        return this._topNode;
    }
    symbTable: SymbTable
    quoted: boolean
    isMacro: boolean
    macros: Map<string, SECDArray>
    callable: Map<string, SECDArray>//and macros
    lexer!: Lexer
    currTok!: LexerToken | null
    private _topNode!: TopNode | null

    constructor() {
        this.symbTable = new SymbTable([])
        this.macros = new Map()
        this.callable = new Map()
        this.quoted = false
        this.isMacro = false
    }

    /**
     * Performs ll-parsing compare operation
     * @param tok lexer token
     * @protected
     */

    protected compare(tok: LexerToken) {
        if (this.currTok == tok)
            this.currTok = this.lexer.getNextToken()
        else {
            if(this.currTok)
                throw new SyntaxError("Syntax error: Excepted " + LexerTokenUtils.toString(this.currTok) + " token but got: " + LexerTokenUtils.toString(tok))
            else 
            throw new SyntaxError("Syntax error: Excepted token but got none")
        }
    }

    /**
     *
     * @param sourceCode source code
     * @param args
     */

    parse(sourceCode: string, args: SymbTable = new SymbTable([])): SECDArray{
        this.lexer = new Lexer(sourceCode)
        this.symbTable = args
        let res = this.loadInstructions()
        return res
    }

    protected loadInstructions(): SECDArray {
        this.currTok = this.lexer.getNextToken()
        let res: SECDArray = new SECDArray(), tmp
        let functions = Array()
        let lastNode: InnerNode | null = null
        while(true) {
            switch (this.currTok) {
                case LexerToken.quote:
                case LexerToken.null:
                case LexerToken.Iden:
                case LexerToken.Str:
                case LexerToken.Bool:
                case LexerToken.Num:
                case LexerToken.leftBracket:
                case LexerToken.backQuote:
                    if(lastNode != undefined)
                        functions.push(lastNode)
                    tmp = this.topLevel()
                    lastNode = tmp[1]
                    res = res.concat(tmp[0])
                    break
                case null:
                    this._topNode = new TopNode(lastNode as InnerNode, functions)
                    res.node = lastNode as InnerNode//TODO maybe erase the node completely
                    return res
                default:
                    throw new SyntaxError("Error while parsing")
            }
        }
    }

    protected topLevel(): [SECDArray, InnerNode] {
        let res: SECDArray = new SECDArray()
        let resTuple: [SECDArray, InnerNode] = [new SECDArray(), new ValueNode(0)]
        switch (this.currTok) {
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                resTuple = this.definition()
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.quote:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.Str:
            case LexerToken.Bool:
            case LexerToken.Num:
            case LexerToken.backQuote:
                res = this.val()
                resTuple = [res, res.getNode()]
                break
        }
        return resTuple
    }

    protected definition(): [SECDArray, InnerNode]{
        let res: SECDArray = new SECDArray(), arr = new SECDArray()
        let args: string[]
        let name: string
        let node: InnerNode = new ValueNode(0)
        let callNode: CallNode
        let compositeNode: CompositeNode = new CompositeNode(Array())
        switch (this.currTok){
            case LexerToken.define:
                this.compare(LexerToken.define)
                name = this.lexer.getCurrString()
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                this.symbTable.addFront(name, args.length)
                compositeNode = new CompositeNode(args.map(arg => new VarNode(arg)))
                this.compare(LexerToken.rightBracket)
                res = this.lambda(compositeNode, 2)
                res.initializeNode()//Move node level above in array
                node = new DefineNode(name, new CompositeNode(args.map(arg => new VarNode(arg))), res.getNode())
                this.callable.set(name, res)
                res.push(new SECDValue(new Instruction(InstructionShortcut.DEFUN), node))
                res.get(0).node = node
                res.get(1).node = node
                arr = res.get(1) as SECDArray
                arr.get(arr.length() - 1).node = node//SET RTN instruction to Define node
                res.node = node
                break
            case LexerToken.defBasicMacro://TODO
                this.compare(LexerToken.defBasicMacro)
                name = this.lexer.getCurrString()
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                this.symbTable.addFront(name, args.length)
                compositeNode = new CompositeNode(args.map(arg => new VarNode(arg)))
                this.compare(LexerToken.rightBracket)
                this.isMacro = true
                res = (this.lambda(compositeNode, 3))
                node = new DefineNode(name, new CompositeNode(args.map(arg => new VarNode(arg))), res.getNode(), true)
                this.isMacro = false
                this.macros.set(name, res)
                this.callable.set(name, res)
                res = new SECDArray()
                res.node = node
                break
            case LexerToken.defHygMacro://TODO
                this.compare(LexerToken.defHygMacro)
                this.iden()
                this.compare(LexerToken.leftBracket)
                this.args()
                this.compare(LexerToken.rightBracket)
                this.expr()
                break
            case LexerToken.struct://TODO
                this.compare(LexerToken.struct)
                this.compare(LexerToken.leftBracket)
                this.iden()
                this.args()
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.Iden:
            case LexerToken.let:
            case LexerToken.letrec:
            case LexerToken.lambda:
            case LexerToken.if:
            case LexerToken.plus:
            case LexerToken.minus:
            case LexerToken.times:
            case LexerToken.division:
            case LexerToken.consp:
            case LexerToken.car:
            case LexerToken.cdr:
            case LexerToken.le:
            case LexerToken.lt:
            case LexerToken.eq:
            case LexerToken.ne:
            case LexerToken.he:
            case LexerToken.ht:
            case LexerToken.and:
            case LexerToken.or:
            case LexerToken.backQuote:
            case LexerToken.comma:
            case LexerToken.begin:
            case LexerToken.leftBracket:
                res = this.expr_body()
                node = new MainNode(<InnerNode> res.getNode())
                break
        }
        return [res, node]
    }

    /**
     * 
     * @param isMacroCall
     * @param bindedVar Variable binded to an expression in let statement
     * @protected
     */

    protected expr(isMacroCall: boolean = false, bindedVar: null | string = null): SECDArray {
        let res: SECDArray = new SECDArray(), tmpArr = new SECDArray()
        switch (this.currTok) {
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                if(this.quoted){
                    tmpArr.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                    tmpArr = tmpArr.concat(this.functionArgs(false))
                    res = tmpArr.concat(res)
                    res.get(0).node = tmpArr.node
                }
                else if(isMacroCall) {
                    res.push(new SECDValue(new Instruction(InstructionShortcut.LDC)))
                    res.push(this.expr_body(bindedVar))
                    res.get(0).node = res.node
                }
                else {
                    res = this.expr_body(bindedVar)
                }
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.backQuote:
                this.compare(LexerToken.backQuote)
                res = this.compileQuote()
                break
            case LexerToken.comma:
                res = this.compileComma()
                break
            case LexerToken.Str:
            case LexerToken.Num:
            case LexerToken.Bool:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.quote:
                res = this.val()
                break
            case LexerToken.let:
            case LexerToken.letrec:
            case LexerToken.lambda:
            case LexerToken.if:
            case LexerToken.begin:
            case LexerToken.plus:
            case LexerToken.minus:
            case LexerToken.times:
            case LexerToken.division:
            case LexerToken.lt:
            case LexerToken.le:
            case LexerToken.eq:
            case LexerToken.he:
            case LexerToken.ht:
            case LexerToken.or:
            case LexerToken.and:
            case LexerToken.car:
            case LexerToken.cdr:
            case LexerToken.consp:
                if(this.quoted){//If quoted, load quoted name of the keyword
                    let node = new QuoteNode(new StringNode(this.lexer.currIdentifier))
                    res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
                    res.push(new SECDValue(this.lexer.currIdentifier, node))
                    this.currTok = this.lexer.getNextToken()
                    break
                }
            default:
                throw new ParserError("Unexpected token: " + LexerTokenUtils.toString(this.currTok as LexerToken))
        }
        return res
    }

    /**
     * 
     * @param bindedVar Variable binded to an expression in let statement
     * @protected
     */

    protected expr_body(bindedVar: null | string = null): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArr, innerArr2: SECDArray
        let args: string[]
        let innerRes: [string[], SECDArray]
        let node: InnerNode
        let compositeNode: CompositeNode
        switch (this.currTok) {
            case LexerToken.let:
                this.compare(LexerToken.let)
                this.compare(LexerToken.leftBracket)
                this.symbTable = this.symbTable.push(new SymbTable([]))
                innerRes = this.letBody()
                res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                res = res.concat(innerRes[1])
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))
                innerArr = this.lambda(compositeNode, 1)
                this.symbTable = this.symbTable.pop()
                res = res.concat(innerArr)
                node = new LetNode(res.getNode(), innerArr.getNode(), false)
                res.get(0).node = node
                res.push(new SECDValue(new Instruction(InstructionShortcut.AP), innerArr.getNode()))
                res.node = node
                break
            case LexerToken.letrec:
                this.compare(LexerToken.letrec)
                this.compare(LexerToken.leftBracket)
                this.symbTable = this.symbTable.push(new SymbTable([]))
                innerRes = this.letBody()
                res.push(new SECDValue(new Instruction(InstructionShortcut.DUM)))
                res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                res = res.concat(innerRes[1])
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))
                innerArr = this.lambda(compositeNode, 1)
                this.symbTable = this.symbTable.pop()
                res = res.concat(innerArr)
                node = new LetNode(res.getNode(), innerArr.getNode(), true)
                res.get(0).node = node
                res.get(1).node = node
                res.push(new SECDValue(new Instruction(InstructionShortcut.RAP), innerArr.getNode()))
                res.node = node
                break
            case LexerToken.lambda:
                this.compare(LexerToken.lambda)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                if(bindedVar)//If this lambda is binded to a variable add the variable to symbTable with number of args of this lambda
                    this.symbTable.add(bindedVar, args.length)
                this.compare(LexerToken.rightBracket)
                res = (this.lambda(new CompositeNode(args.map(arg => new VarNode(arg)))))
                break
            case LexerToken.if:
                this.compare(LexerToken.if)
                res = this.expr()
                innerArr = this.expr()
                innerArr2 = this.expr()
                node = new IfNode(<InnerNode> res.getNode(), <InnerNode> innerArr.getNode(), <InnerNode> innerArr2.getNode())
                res.push(new SECDValue(new Instruction(InstructionShortcut.SEL), node))
                innerArr.push(new SECDValue(new Instruction(InstructionShortcut.JOIN), node))
                res.push(innerArr)
                innerArr2.push(new SECDValue(new Instruction(InstructionShortcut.JOIN), node))
                res.push(innerArr2)
                res.node = node
                break
            case LexerToken.begin:
                this.compare(LexerToken.begin)
                res = this.beginBody()
                res.node = new BeginNode(res.node as CompositeNode)
                break
            case LexerToken.printf://TODO
                this.compare(LexerToken.printf)
                this.compare(LexerToken.Str)
                this.args()
                break
            case LexerToken.plus:
            case LexerToken.minus:
            case LexerToken.times:
            case LexerToken.division:
            case LexerToken.lt:
            case LexerToken.le:
            case LexerToken.eq:
            case LexerToken.he:
            case LexerToken.ht:
            case LexerToken.or:
            case LexerToken.and:
                res = this.compileBinaryOperator(this.getOperator())
                break
            case LexerToken.car:
            case LexerToken.cdr:
            case LexerToken.consp:
                res = this.compileUnaryOperator(this.getOperator())
                break
            case LexerToken.Str:
            case LexerToken.Num:
            case LexerToken.Bool:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.quote:
                if(this.quoted) {
                    res = this.val()
                    break
                }
                if(this.currTok !== LexerToken.Iden)
                    throw new ParserError("Expected function name")
            case LexerToken.leftBracket:
                res = this.functionCall()
                break
        }
        return res
    }

    protected val(isMacroCall: boolean = false): SECDArray {
        let res: SECDArray = new SECDArray()
        if(isMacroCall){
            if(this.currTok === LexerToken.Num){//Num is macro does not need to be loaded as string
                res.push(new SECDValue(this.lexer.currVal, new ValueNode(this.lexer.currVal)))
                this.compare(LexerToken.Num)
            }
            else if(this.currTok === LexerToken.Bool){//Bool in macro does not need to be loaded as string
                res.push(new SECDValue(this.lexer.currVal, new ValueNode(this.lexer.currVal)))
                this.compare(LexerToken.Bool)
            }
            else {//Load as string
                res.push(new SECDValue(this.lexer.currIdentifier, new StringNode(this.lexer.currIdentifier)))
                this.currTok = this.lexer.getNextToken()
            }
        }
        else {
            switch (this.currTok) {
                case LexerToken.Str:
                    res = this.str()
                    this.compare(LexerToken.Str)
                    break
                case LexerToken.Bool:
                    res = this.num()
                    this.compare(LexerToken.Bool)
                    break
                case LexerToken.Num:
                    res = this.num()
                    this.compare(LexerToken.Num)
                    break
                case LexerToken.Iden:
                    /*if (this.symbTable.getArgsCnt(this.lexer.currIdentifier) >= 0)
                        throw new ParserError("Use of uncallable identifier")
                    */res = this.iden()
                    break
                case LexerToken.null:
                    this.compare(LexerToken.null)
                    res.node = new NullNode()
                    break
                case LexerToken.quote:
                    this.compare(LexerToken.quote)
                    res = this.compileQuote()
                    break
                case LexerToken.backQuote:
                    this.compare(LexerToken.backQuote)
                    res = this.compileQuote()
                    break
                default:
                    throw new ParserError("Unknown lexer token")
            }
        }
        return res
    }

    /**
     * 
     * @param isCall wheater iden is beginning identifier of function call
     * @protected
     */

    protected iden(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new VarNode(this.lexer.getCurrString())
        res.push(new SECDValue(new Instruction(InstructionShortcut.LD), node))
        let innerArr = this.symbTable.getPos(this.lexer.getCurrString())
        if(((innerArr.get(0) as SECDValue).constant.val) < 0 || ((innerArr.get(1) as SECDValue).constant.val) < 0)
            throw new ParserError("Use of undeclared identifier " + this.lexer.getCurrString())
        res.push(innerArr)
        res.setNode(node);
        innerArr.get(0).setNode(innerArr.get(1).getNode())//add node also to first digit
        this.compare(LexerToken.Iden)
        return res
    }

    protected args(): string[]{
        let res: string[] = []
        switch (this.currTok) {
            case LexerToken.rightBracket:
                break
            case LexerToken.dot:
                this.compare(LexerToken.dot)
                this.iden()//TODO jako dole
                this.args()
                break
            case LexerToken.Iden:
                res = [this.lexer.getCurrString()]
                this.compare(LexerToken.Iden)
                res =  res.concat(this.args())
                break
        }
        return res
    }

    protected letBody(): [string[], SECDArray] {
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray = new SECDArray()
        let args: Array<string> = []
        let arg: string
        let innerRes: [string[], SECDArray]
        switch (this.currTok){
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                arg = this.lexer.getCurrString()
                this.compare(LexerToken.Iden)
                res = this.expr(false, arg)
                res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), res.getNode()))
                this.compare(LexerToken.rightBracket)
                innerRes = this.letBody()
                args = innerRes[0]
                innerArr = innerRes[1]
                args.push(arg)
                if(!innerArr.empty())
                    res = res.concat(innerArr)
                let exprNode = res.node
                res.node = innerArr.getNode();
                (res.node as CompositeNode).addItemFront(new BindNode(new VarNode(arg), exprNode))
                break
            case LexerToken.rightBracket:
                res.node = new CompositeNode([])
                break
        }
        return [args, res]
    }

    /**
     * Compiles expressions inside of begin statement
     * @protected
     */

    protected beginBody(): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray = new SECDArray()
        switch (this.currTok){
            case LexerToken.leftBracket:
                res = this.expr()//Compile expression
                innerArr = this.beginBody()//Move to next expression
                let exprNode = res.node;
                (innerArr.node as CompositeNode).addItemFront(exprNode)
                if(!innerArr.empty())//Last expr is not followed by POP, others are
                    res.push(new SECDValue(new Instruction(InstructionShortcut.POP), exprNode))
                res = res.concat(innerArr)
                res.node = innerArr.node
                break
            case LexerToken.rightBracket:
                res.node = new CompositeNode(Array())
                break
        }
        return res
    }

    protected functionCall(): SECDArray{
        let res: SECDArray = new SECDArray()
        let innerArr, innerArr2: SECDArray
        innerArr = this.expr()
        let isMacro = false
        if(innerArr.node instanceof VarNode &&  this.macros.get(innerArr.node.variable))  {//If it is macro
            innerArr2 = this.functionArgs(true).reverse()
            let marcoByteCode = this.macros.get((innerArr.node as VarNode).variable) as SECDArray//We are sure node is VarNode and key in map
            let arr = new SECDArray()
            let globals = new SECDArray()
            arr.push(globals)
            arr.push(innerArr2)
            this.callable.forEach((val, key) => {
                let res = new SECDArray()
                res.push(val.get(1))
                res.push(arr)
                globals.push(res)
            })//Array for global functions
            
            let interpreter = new Interpreter(marcoByteCode, new TopNode(marcoByteCode.getNode(), Array()), arr)//Run interpreter with macro arguments as environment
            interpreter.run()
            let evaluated = interpreter.state.stack.get(0)
            let parser = new Parser()
            let reducedMacro = evaluated.print()//Print list as String
            reducedMacro = reducedMacro.slice(1, -1)//Remove addtional parentesses
            res = parser.parse(reducedMacro, this.symbTable)
            res.node = (res.node as MainNode).node
        }
        else {
            innerArr2 = this.functionArgs(false)
            let functionArgs
            let argsCnt = -1
            innerArr.initializeNode()//important
            if (innerArr.node instanceof VarNode)
                argsCnt = this.symbTable.getArgsCnt(innerArr.node.variable)
            else if (innerArr.node instanceof LambdaNode)
                argsCnt = (innerArr.node.vars() as CompositeNode).items().length
            if (argsCnt < 0)
                throw new ParserError("Use of uncallable identifier")
            if (argsCnt != (innerArr2.getNode() as CompositeNode).items().length)
                throw new ParserError("There are " + argsCnt + " arguments to function but " + (innerArr2.getNode() as CompositeNode).items().length + " are expected")
            let node = new FuncNode(<InnerNode>innerArr.node, <InnerNode>innerArr2.getNode())
            res.push(new SECDValue(new Instruction(InstructionShortcut.NIL), node))
            res = res.concat(innerArr2)
            res.node = node//This is important
            res = res.concat(innerArr)
            res.push(new SECDValue(new Instruction(InstructionShortcut.AP), (<FuncNode> res.getNode()).func()))
            res.get(res.length() - 1).node = res.node
        }
        return res
    }

    protected functionArgs(isMacroCall: boolean): SECDArray {
        let tmpArr = new SECDArray(), res: SECDArray = new SECDArray()
        let node: CompositeNode = new CompositeNode(Array())
        if (this.quoted || isMacroCall){
            switch (this.currTok) {
                case LexerToken.leftBracket:
                    this.compare(LexerToken.leftBracket)
                    let innerArr = this.functionArgs(isMacroCall)
                    if(isMacroCall) {
                        res.push(innerArr)//inner list in list
                    }
                    else {
                        res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                        res = res.concat(innerArr)
                        res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), res.node))
                        res.get(0).node = res.node//Set NIL node to node of the whole arr
                    }

                    this.compare(LexerToken.rightBracket)
                    let otherArgs = this.functionArgs(isMacroCall)
                    node = (<CompositeNode>otherArgs.getNode())
                    res = res.concat(otherArgs)
                    node.addItemBack(<InnerNode> innerArr.getNode())
                    break
                case LexerToken.rightBracket:
                    node = new CompositeNode(Array())
                    break
                default:
                    if(isMacroCall)
                        tmpArr = this.val(isMacroCall)//If macro call
                    else {
                        tmpArr = this.expr(isMacroCall)//If quoted list
                        tmpArr.push(new SECDValue(new Instruction(InstructionShortcut.CONS), tmpArr.getNode()))
                    }
                    let valNode = tmpArr.getNode()
                    res = this.functionArgs(isMacroCall)
                    node = (<CompositeNode> res.getNode())
                    res = tmpArr.concat(res)
                    node.addItemFront(valNode)
                    break
            }
        }
        else {
            switch (this.currTok) {
                case LexerToken.leftBracket:
                case LexerToken.null:
                case LexerToken.Iden:
                case LexerToken.Str:
                case LexerToken.Bool:
                case LexerToken.Num:
                case LexerToken.quote:
                case LexerToken.comma:
                    tmpArr = this.expr(isMacroCall)
                    tmpArr.push(new SECDValue(new Instruction(InstructionShortcut.CONS), tmpArr.getNode()))
                    res = this.functionArgs(isMacroCall)
                    node = (<CompositeNode>res.getNode())
                    res = res.concat(tmpArr)
                    node.addItemBack(<InnerNode>tmpArr.getNode())
                    break
                case LexerToken.rightBracket:
                    node = new CompositeNode(Array())
                    break
            }
        }
        res.node = node
        return res
    }

    protected str(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new StringNode(this.lexer.getCurrString())
        res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
        res.push(new SECDValue(this.lexer.getCurrString()))
        res.setNode(node)
        return res
    }

    protected num(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new ValueNode(this.lexer.getCurrNumber())
        res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
        res.push(new SECDValue(this.lexer.getCurrNumber()))
        res.setNode(node)
        return res
    }

    protected lambda(args: CompositeNode, isCall: number = 0): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArray: SECDArray
        this.symbTable = this.symbTable.push(new SymbTable(args.items().map(item => (<VarNode>item).variable)))
        if (isCall == 3) {//Macros
            let res = this.compileMacro()
            let node = new CallNode(res.getNode())
            res.node = node
            res.get(res.length() - 1)
            res.get(res.length() - 2)
            this.symbTable = this.symbTable.pop()
            return res
        } 
        else {
            innerArray = this.expr()
            let node
            switch (isCall) {
                case 2://Functions
                case 1://Let
                    node = new CallNode(innerArray.getNode())
                    break
                case 0:
                default:
                    node = new LambdaNode(args, <InnerNode>innerArray.getNode())
                    break
            }
            res.push(new SECDValue(new Instruction(InstructionShortcut.LDF), node))
            innerArray.push(new SECDValue(new Instruction(InstructionShortcut.RTN), node))
            innerArray.setNode(node)
            res.push(innerArray)
            this.symbTable = this.symbTable.pop()
            return res
        }
    }
    
    protected compileUnaryOperator(instructionShortcut: InstructionShortcut): SECDArray{
        let res = this.expr()
        let operatorNode = new OperatorNode(instructionShortcut)
        let node = new UnaryExprNode(operatorNode, <InnerNode> res.getNode())
        res.push(new SECDValue(new Instruction(instructionShortcut), operatorNode))
        res.setNode(node)
        return res
    }

    /**
     * Returns compiled code of binary expression and its arguments
     * @param instructionShortcut shortcup of the operator
     * @protected
     */

    protected compileBinaryOperator(instructionShortcut: InstructionShortcut): SECDArray{
        let res = this.expr()//First argument
        let innerArr = this.expr()//Second argument
        let firstArgNode = res.getNode()
        let secondArgNode = innerArr.getNode()
        res = innerArr.concat(res)
        let operatorNode = new OperatorNode(instructionShortcut)
        let node = new BinaryExprNode(firstArgNode, secondArgNode, operatorNode)
        res.push(new SECDValue(new Instruction(instructionShortcut), operatorNode))
        res.setNode(node)
        return res
    }
    
    
    protected compileQuote(): SECDArray{
        this.quoted = true
        let res = new SECDArray()
        res = res.concat(this.expr())
        res.get(0).node = res.getNode()
        this.quoted = false
        res.node = new QuoteNode(res.node)
        return res
    }

    protected compileComma(): SECDArray{
        this.compare(LexerToken.comma)
        this.quoted = false
        let res = this.expr()
        this.quoted = true
        res.node = new CommaNode(res.getNode())
        return res
    }

    /**
     * Converts currTok of type LexerToken to equivalent InstructionShortcut
     * @private
     */

    private getOperator(): InstructionShortcut{
        switch (this.currTok) {
            case LexerToken.plus:
                this.compare(LexerToken.plus)
                return InstructionShortcut.ADD
            case LexerToken.minus:
                this.compare(LexerToken.minus)
                return InstructionShortcut.SUB
            case LexerToken.times:
                this.compare(LexerToken.times)
                return InstructionShortcut.MUL
            case LexerToken.division:
                this.compare(LexerToken.division)
                return InstructionShortcut.DIV
            case LexerToken.lt:
                this.compare(LexerToken.lt)
                return InstructionShortcut.LT
            case LexerToken.le:
                this.compare(LexerToken.le)
                return InstructionShortcut.LE
            case LexerToken.eq:
                this.compare(LexerToken.eq)
                return InstructionShortcut.EQ
            case LexerToken.he:
                this.compare(LexerToken.he)
                return InstructionShortcut.HE
            case LexerToken.ht:
                this.compare(LexerToken.ht)
                return InstructionShortcut.HT
            case LexerToken.or:
                this.compare(LexerToken.or)
                return InstructionShortcut.OR
            case LexerToken.and:
                this.compare(LexerToken.and)
                return InstructionShortcut.AND
            case LexerToken.car:
                this.compare(LexerToken.car)
                return InstructionShortcut.CAR
            case LexerToken.cdr:
                this.compare(LexerToken.cdr)
                return InstructionShortcut.CDR
            case LexerToken.consp:
                this.compare(LexerToken.consp)
                return InstructionShortcut.CONSP
            default:
                throw new ParserError("Unknown operator")
        }
    }


    private compileMacro(): SECDArray{
        let res: SECDArray = new SECDArray()
        let macroStr = this.lexer.loadMacro()
        let compositeNode = new CompositeNode(Array())
        let node = new StringNode(macroStr.substring(1))//Remove first (
        res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
        res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
        compositeNode.addItemBack(node)
        res.push(new SECDValue(macroStr, node))
        res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), node))
        while (this.lexer.loadingMacro){
            this.currTok = this.lexer.getNextToken()
            let expr = this.lexer.loadExpr()
            let evaluated = new Parser().parse(expr, this.symbTable)
            let evaluatedNode = new CommaNode(evaluated.getNode())
            compositeNode.addItemBack(evaluatedNode)
            evaluated.node = evaluatedNode
            res = res.concat(evaluated)
            res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), evaluatedNode))
            macroStr = ' ' + this.lexer.loadMacro()
            if(!this.lexer.loadingMacro)//Remove last )
                node = new StringNode(macroStr.slice(0, -1))
            res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
            compositeNode.addItemBack(node)
            res.push(new SECDValue(macroStr, node))
            res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), node))
        }
        let quoteNode = new QuoteNode(compositeNode)
        res.node = quoteNode
        res.get(0).node = quoteNode
        this.currTok = LexerToken.rightBracket
        this.lexer.loadWhitespaces()
        this.lexer.lastChar = null
        return res
    }
}