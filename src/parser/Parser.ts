import {LexerToken} from "../lexer/LexerTokens"
import {Lexer} from "../lexer/Lexer"
import {Instruction} from "../SECD/instructions/Instruction"
import {SymbTable} from "./SymbTable"
import {SECDArray} from "../SECD/SECDArray"
import {SECDValue} from "../SECD/SECDValue"
import {InstructionShortcut} from "../SECD/instructions/InstructionShortcut"
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
import {SECDElement} from "../SECD/SECDElement";
import { ParserError } from "./ParserErrors"
import { SECDConstant } from "../SECD/SECDConstant"
import { LexerTokenUtils } from "../lexer/LexerTokenUtils"
import { Interpreter } from "../interpreter/Interpreter"


export class Parser{
    get topNode(): TopNode | null {
        return this._topNode;
    }
    symbTable: SymbTable
    quoted: boolean
    isMacro: boolean
    definingMacro: boolean
    macros: Map<string, SECDArray>
    callable: Map<string, SECDArray>//and macros
    lexer!: Lexer
    currTok: LexerToken
    private _topNode!: TopNode | null

    constructor() {
        this.symbTable = new SymbTable([])
        this.macros = new Map()
        this.callable = new Map()
        this.quoted = false
        this.isMacro = false
        this.definingMacro = false
        this.currTok = LexerToken.end
    }

    /**
     * Performs ll-parsing compare operation
     * @param tok lexer token
     * @private
     */

    private compare(tok: LexerToken) {
        if (this.currTok == tok)
            this.currTok = this.lexer.getNextToken()
        else {
            throw new SyntaxError("Syntax error: Excepted " + LexerTokenUtils.toString(this.currTok) + " token but got: " + LexerTokenUtils.toString(tok))
        }
    }

    /**
     * compile and parse source code
     * @param sourceCode source code
     * @param args
     */

    parse(sourceCode: string, args: SymbTable = new SymbTable([])): SECDArray{
        this.lexer = new Lexer(sourceCode)
        this.symbTable = args
        let res = this.loadInstructions()
        return res
    }

    /**
     * inner method to compile and parse source code
     * @private
     */

    private loadInstructions(): SECDArray {
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
                case LexerToken.end:
                    this._topNode = new TopNode(lastNode as InnerNode, functions)
                    res.node = lastNode as InnerNode//TODO maybe erase the node completely
                    return res
                default:
                    throw new SyntaxError("Error while parsing")
            }
        }
    }

    /**
     * Compiles next top level definition
     * @private
     */

    private topLevel(): [SECDArray, InnerNode] {
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

    /**
     * Compiles top statement definition
     * @private
     */

    private definition(): [SECDArray, InnerNode]{
        let res: SECDArray = new SECDArray(), arr = new SECDArray()
        let args: string[]
        let name: string
        let node: InnerNode = new ValueNode(0)
        let callNode: CallNode
        let compositeNode: CompositeNode = new CompositeNode(Array())
        switch (this.currTok){
            case LexerToken.define:
                this.compare(LexerToken.define)
                this.compare(LexerToken.leftBracket)
                name = this.lexer.getCurrString()
                this.compare(LexerToken.Iden)
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
            case LexerToken.defMacro:
                this.definingMacro = true
                this.compare(LexerToken.defMacro)
                this.compare(LexerToken.leftBracket)
                name = this.lexer.getCurrString()
                this.compare(LexerToken.Iden)
                args = this.args()
                this.symbTable.addFront(name, args.length)
                compositeNode = new CompositeNode(args.map(arg => new VarNode(arg)))
                this.compare(LexerToken.rightBracket)
                this.isMacro = true
                res = (this.lambda(compositeNode, 3))
                node = new DefineNode(name, new CompositeNode(args.map(arg => new VarNode(arg))), res.getNode(), true)
                this.isMacro = false
                this.macros.set(name, res)//add code to the macro map
                this.callable.set(name, res)//add code to the map of all callables
                res = new SECDArray()
                res.node = node
                this.definingMacro = false
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
            case LexerToken.cons:
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
     * @param isMacroCall - true if it is call of macro
     * @param boundVar - it is name of the bound variable if this is body of the bound expression in let, otherwise null
     * @private
     */

    private expr(isMacroCall: boolean = false, boundVar: null | string = null): SECDArray {
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
                    res.push(this.expr_body(boundVar))
                    res.get(0).node = res.node
                }
                else {
                    res = this.expr_body(boundVar)
                }
                this.compare(LexerToken.rightBracket)
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
            case LexerToken.backQuote:
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
            case LexerToken.cons:
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
     * Compiles body of the expression
     * @param boundVar - it is name of the bound variable if this is body of the bound expression in let, otherwise null
     * @private
     */

    private expr_body(boundVar: null | string = null): SECDArray {
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
                innerRes = this.letBody()
                res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                res = res.concat(innerRes[1])
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))
                innerArr = this.lambda(compositeNode, 1)
                res = res.concat(innerArr)
                node = new LetNode(res.getNode(), innerArr.getNode(), false)
                res.get(0).node = node
                res.push(new SECDValue(new Instruction(InstructionShortcut.AP), innerArr.getNode()))
                res.node = node
                break
            case LexerToken.letrec:
                this.compare(LexerToken.letrec)
                this.compare(LexerToken.leftBracket)
                innerRes = this.letBody()
                res.push(new SECDValue(new Instruction(InstructionShortcut.DUM)))
                res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                res = res.concat(innerRes[1])
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))
                innerArr = this.lambda(compositeNode, 1)
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
                if(boundVar)//If this lambda is binded to a variable add the variable to symbTable with number of args of this lambda
                    this.symbTable.add(boundVar, args.length)
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
            case LexerToken.cons:
                this.compare(LexerToken.cons)
                innerArr = this.expr()//First argument
                let firstArgNode = innerArr.getNode()
                res = res.concat(innerArr)
                let operatorNode = new OperatorNode(InstructionShortcut.CONS)
                innerArr = this.expr()//Second argument
                let secondArgNode = innerArr.getNode()
                node = new BinaryExprNode(firstArgNode, secondArgNode, operatorNode)
                res.get(0).node = node
                res.setNode(node)
                res = res.concat(innerArr)
                res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), innerArr.node))
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

    /**
     * Compiles value
     * @param isMacroCall - true if inside of macro call, otherwise false
     * @private
     */

    private val(isMacroCall: boolean = false): SECDArray {
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
                    res = this.compileQuote(false)
                    break
                case LexerToken.backQuote:
                    this.compare(LexerToken.backQuote)
                    res = this.compileQuote(true)
                    break
                default:
                    throw new ParserError("Unknown lexer token")
            }
        }
        return res
    }

    /**
     * Compiles identifier
     * @private
     */
    
    private iden(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new VarNode(this.lexer.getCurrString())
        if(this.quoted){
            res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
            res.push(new SECDValue(this.lexer.getCurrString(), node))
        }
        else {
            res.push(new SECDValue(new Instruction(InstructionShortcut.LD), node))
            let innerArr = this.symbTable.getPos(this.lexer.getCurrString())
            if (((innerArr.get(0) as SECDValue).constant as unknown as number) < 0 || ((innerArr.get(1) as SECDValue).constant as unknown as number) < 0)
                throw new ParserError("Use of undeclared identifier " + this.lexer.getCurrString())
            res.push(innerArr)
            res.setNode(node);
            innerArr.get(0).setNode(innerArr.get(1).getNode())//add node also to first digit
        }
        this.compare(LexerToken.Iden)
        return res
    }

    private args(): string[]{
        let res: string[] = []
        switch (this.currTok) {
            case LexerToken.rightBracket:
                break
            case LexerToken.Iden:
                res = [this.lexer.getCurrString()]
                this.compare(LexerToken.Iden)
                res =  res.concat(this.args())
                break
        }
        return res
    }

    private letBody(): [string[], SECDArray] {
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
     * Compiles expressions inside of the begin statement
     * @private
     */

    private beginBody(): SECDArray {
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

    private functionCall(): SECDArray{
        let res: SECDArray = new SECDArray()
        let innerArr, innerArr2: SECDArray
        innerArr = this.expr()
        let isMacro = false
        if(innerArr.node instanceof VarNode &&  this.macros.get(innerArr.node.variable))  {//If it is macro
            innerArr2 = this.functionArgs(true).reverse()
            let marcoByteCode = this.macros.get((innerArr.node as VarNode).variable) as SECDArray//We are sure node is VarNode and key in map
            let environment = new SECDArray()
            let globals = new SECDArray()
            environment.push(globals)
            environment.push(innerArr2)
            this.callable.forEach((val, key) => {
                let res = new SECDArray()
                res.push(val.get(1))
                res.push(environment)
                globals.push(res)
            })//Array for global functions
            
            let interpreter = new Interpreter(marcoByteCode, new TopNode(marcoByteCode.getNode(), Array()), environment)//Run interpreter with macro arguments as environment
            interpreter.run()
            let evaluated = interpreter.state.stack.get(0)
            let parser = new Parser()
            let reducedMacro = evaluated.print()//Print list as String
            res = parser.parse(reducedMacro, this.symbTable)//Parse the returned string
            res.node = (res.node as MainNode).node//Get the node of the parsed expression
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
                throw new ParserError("There are " + argsCnt + " arguments to a function but " + (innerArr2.getNode() as CompositeNode).items().length + " are expected")
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

    private functionArgs(isMacroCall: boolean): SECDArray {
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
                    node.addItemFront(<InnerNode> innerArr.getNode())
                    break
                case LexerToken.rightBracket:
                    node = new CompositeNode(Array())
                    break
                default:
                    if(isMacroCall)
                        tmpArr = this.val(isMacroCall)//If macro call
                    else {
                        tmpArr = this.expr()//If quoted list
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

    /**
     * Compiles string
     * @private
     */

    private str(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new StringNode(this.lexer.getCurrString())
        res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
        res.push(new SECDValue(this.lexer.getCurrString()))
        res.setNode(node)
        return res
    }

    /**
     * Compiles number
     * @private
     */

    private num(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new ValueNode(this.lexer.getCurrNumber())
        res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
        res.push(new SECDValue(this.lexer.getCurrNumber()))
        res.setNode(node)
        return res
    }

    /**
     * Compiles lambda function
     * @param args - node containing arguments of the lambda
     * @param isCall
     * @private
     */

    private lambda(args: CompositeNode, isCall: number = 0): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArray: SECDArray
        this.symbTable = this.symbTable.push(new SymbTable(args.items().map(item => (<VarNode>item).variable)))
        if (isCall == 3) {//Macros
            let res = this.expr()
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

    /**
     * Compiles unary operator
     * @param instructionShortcut - shortcut of the operator
     * @private
     */

    private compileUnaryOperator(instructionShortcut: InstructionShortcut): SECDArray{
        let res = this.expr()
        let operatorNode = new OperatorNode(instructionShortcut)
        let node = new UnaryExprNode(operatorNode, <InnerNode> res.getNode())
        res.push(new SECDValue(new Instruction(instructionShortcut), operatorNode))
        res.setNode(node)
        return res
    }

    /**
     * Compiles binary expression
     * @param instructionShortcut - shortcut of the operator
     * @private
     */

    private compileBinaryOperator(instructionShortcut: InstructionShortcut): SECDArray{
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

    /**
     * Compiles quote and the following expression
     * @private
     */
    
    private compileQuote(isBackQuote: boolean): SECDArray{
        this.quoted = true
        let res = new SECDArray()
        res = res.concat(this.expr())
        res.get(0).node = res.getNode()
        this.quoted = false
        res.node = new QuoteNode(res.node, isBackQuote)
        return res
    }

    /**
     * Compiles comma and the following expression
     * @private
     */

    private compileComma(): SECDArray{
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
            case LexerToken.cons:
                this.compare(LexerToken.cons)
                return InstructionShortcut.CONS
            case LexerToken.car:
                this.compare(LexerToken.car)
                return InstructionShortcut.CAR
            case LexerToken.cdr:
                this.compare(LexerToken.cdr)
                return InstructionShortcut.CDR
            case LexerToken.cons:
                this.compare(LexerToken.cons)
                return InstructionShortcut.CONS
            case LexerToken.consp:
                this.compare(LexerToken.consp)
                return InstructionShortcut.CONSP
            default:
                throw new ParserError("Unknown operator")
        }
    }
}