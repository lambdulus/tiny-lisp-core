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
    ApplicationNode,
    IfNode,
    InnerNode,
    LambdaNode, LetNode,
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

enum FuncType{
    LAMBDA,
    LET,
    GLOBAL,
    MACRO
}


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
    currTok: LexerToken
    private _topNode!: TopNode | null
    letBodys: Array<string>

    constructor() {
        this.symbTable = new SymbTable([])
        this.macros = new Map()
        this.callable = new Map()
        this.quoted = false
        this.isMacro = false
        this.currTok = LexerToken.end
        this.letBodys = Array()
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

    parse(sourceCode: string, args: SymbTable = new SymbTable([]), isMacroExpansion: boolean = false): SECDArray{
        this.symbTable = args
        this.lexer = new Lexer(sourceCode, isMacroExpansion)//create lexer
        let res = this.loadInstructions()//compile
        return res
    }

    /**
     * inner method to compile and parse source code
     * @private
     */

    private loadInstructions(): SECDArray {
        this.currTok = this.lexer.getNextToken()
        let res: SECDArray = new SECDArray(), tmp
        let exprs = Array()
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
                        exprs.push(lastNode)
                    tmp = this.topLevel()
                    lastNode = tmp[1]
                    res = res.concat(tmp[0])
                    break
                case LexerToken.end:
                    exprs.push(lastNode)
                    this._topNode = new TopNode(exprs)
                    res.node = lastNode as InnerNode
                    return res
                default:
                    throw new SyntaxError("Unexpected top level statement")
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
                res = this.val()//If val without brackets
                resTuple = [res, res.node]
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
                name = this.lexer.getCurrString()//name of the function
                this.compare(LexerToken.Iden)
                args = this.args()//parameters of the function
                this.symbTable.addFront(name, args.length)//add this fce to symbtable
                compositeNode = new CompositeNode(args.map(arg => new VarNode(arg)))
                this.compare(LexerToken.rightBracket)
                res = this.lambdaBody(compositeNode, FuncType.GLOBAL)
                node = new DefineNode(name, new CompositeNode(args.map(arg => new VarNode(arg))), res.node)
                this.callable.set(name, res)
                res.push(new SECDValue(new Instruction(InstructionShortcut.DEFUN), node))
                res.get(0).node = node//SET LDF to Define node
                res.get(1).node = node//SET fce body to Define node
                arr = res.get(1) as SECDArray
                arr.get(arr.length() - 1).node = node//SET RTN instruction to Define node
                res.node = node
                break
            case LexerToken.defMacro:
                this.compare(LexerToken.defMacro)
                this.compare(LexerToken.leftBracket)
                name = this.lexer.getCurrString()
                this.compare(LexerToken.Iden)
                args = this.args()//macro args names
                this.symbTable.addFront(name, args.length)//add this macro to symbtable
                compositeNode = new CompositeNode(args.map(arg => new VarNode(arg)))
                this.compare(LexerToken.rightBracket)
                this.isMacro = true
                res = new SECDArray()
                res.push(new SECDValue(new Instruction(InstructionShortcut.LDF)))
                res.push(this.lambdaBody(compositeNode, FuncType.MACRO))
                res.node = res.get(1).node
                node = new DefineNode(name, new CompositeNode(args.map(arg => new VarNode(arg))), res.node, true)
                this.isMacro = false
                this.macros.set(name, res)//add code to the macro map
                this.callable.set(name, res)//add code to the map of all callables
                res = new SECDArray()
                res.node = node
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
                node = new MainNode(res.node)
                break
        }
        return [res, node]
    }

    /**
     * 
     * @param isMacroCall - true if it is call of macro
     * @private
     */

    private expr(isMacroCall: boolean = false): SECDArray {
        let res: SECDArray = new SECDArray(), tmpArr = new SECDArray()
        switch (this.currTok) {
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                if(this.quoted){
                    //load quoted list
                    res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                    res = res.concat(this.listElements(false))
                    res.get(0).node = tmpArr.node
                }
                else if(isMacroCall) {
                    //macro arguments are quoted
                    res.push(new SECDValue(new Instruction(InstructionShortcut.LDC)))
                    res.push(this.expr_body())
                    res.get(0).node = res.node
                }
                else {
                    res = this.expr_body()
                }
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.comma:
                if(this.quoted)
                    res = this.compileComma()
                else 
                    throw new ParserError("Comma used outside of a list")
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
                    res.node = node
                    this.currTok = this.lexer.getNextToken()//We did not get new token from compare so we need to do this
                    break
                }
            default:
                throw new ParserError("Unexpected token: " + LexerTokenUtils.toString(this.currTok as LexerToken))
        }
        return res
    }

    /**
     * Compiles body of the expression
     * @private
     */

    private expr_body(): SECDArray {
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
                innerRes = this.letBindings()
                res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                res = res.concat(innerRes[1])//add compiled code of let expression in bindings
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))//add variables of bindings to composite node
                innerArr = this.lambdaBody(compositeNode, FuncType.LET)//compile let body
                res = res.concat(innerArr)//add compiled code of bodu
                node = new LetNode(res.node, innerArr.node, false)
                res.get(0).node = node
                res.push(new SECDValue(new Instruction(InstructionShortcut.AP), innerArr.node))
                res.node = node
                break
            case LexerToken.letrec:
                this.compare(LexerToken.letrec)
                this.compare(LexerToken.leftBracket)
                innerRes = this.letBindings()
                res.push(new SECDValue(new Instruction(InstructionShortcut.DUM)))
                res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
                res = res.concat(innerRes[1])//add compiled code of let expression in bindings
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))//add variables of bindings to composite node
                innerArr = this.lambdaBody(compositeNode, FuncType.LET)//compile let body
                res = res.concat(innerArr)//add compiled code of bodu
                node = new LetNode(res.node, innerArr.node, true)
                res.get(0).node = node//DUM
                res.get(1).node = node//NIL
                res.push(new SECDValue(new Instruction(InstructionShortcut.RAP), innerArr.node))
                res.node = node
                break
            case LexerToken.lambda:
                this.compare(LexerToken.lambda)
                this.compare(LexerToken.leftBracket)
                args = this.args()//Lambda args
                this.compare(LexerToken.rightBracket)
                res = this.lambdaBody(new CompositeNode(args.map(arg => new VarNode(arg))), FuncType.LAMBDA)//body
                break
            case LexerToken.if:
                this.compare(LexerToken.if)
                res = this.expr()//condition
                innerArr = this.expr()//First branch
                innerArr2 = this.expr()//Second branch
                node = new IfNode(<InnerNode> res.node, <InnerNode> innerArr.node, <InnerNode> innerArr2.node)
                //SEL and JOIN instruction all have the ifNode
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
                let firstArgNode = innerArr.node
                res = innerArr
                let operatorNode = new OperatorNode(InstructionShortcut.CONS)
                innerArr = this.expr()//Second argument
                let secondArgNode = innerArr.node
                node = new BinaryExprNode(firstArgNode, secondArgNode, operatorNode)
                res = res.concat(innerArr)//combine compiled arguments
                res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), operatorNode))
                res.node = node
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
     * @param isMacroCall - true if inside of a macro call, otherwise false
     * @private
     */

    private val(isMacroCall: boolean = false): SECDArray {
        let res: SECDArray = new SECDArray()
        if(isMacroCall){
            if(this.currTok === LexerToken.Num){//Num is macro does not need to be loaded as string
                let node = new ValueNode(this.lexer.currVal)
                res.push(new SECDValue(this.lexer.currVal, node))
                res.node = node
                this.compare(LexerToken.Num)
            }
            else if(this.currTok === LexerToken.Bool){//Bool in macro does not need to be loaded as string
                let node = new ValueNode(this.lexer.currVal)
                res.push(new SECDValue(this.lexer.currVal, node))
                res.node = node
                this.compare(LexerToken.Bool)
            }
            else {//Load as string
                let node = new StringNode(this.lexer.currIdentifier)
                res.push(new SECDValue(this.lexer.currIdentifier, node))
                res.node = node
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
                    res = this.iden()
                    break
                case LexerToken.null:
                    this.compare(LexerToken.null)
                    res.push(new SECDValue(new Instruction(InstructionShortcut.NIL)))
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
     * Compiles an identifier
     * @private
     */
    
    private iden(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new VarNode(this.lexer.getCurrString())
        if(this.quoted){//If inside a list, just load the identifier as string
            res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
            res.push(new SECDValue(this.lexer.getCurrString(), node))
            res.node = node
        }
        else {
            //If not quoted compile to LD and indices of the variable in symbtable
            res.push(new SECDValue(new Instruction(InstructionShortcut.LD), node))
            let innerArr = this.symbTable.getPos(this.lexer.getCurrString())//get indexes in symbTable
            if (((innerArr.get(0) as SECDValue).constant as unknown as number) < 0 || ((innerArr.get(1) as SECDValue).constant as unknown as number) < 0)
                throw new ParserError("Use of undeclared identifier " + this.lexer.getCurrString())//var was not found
            res.push(innerArr)
            res.node = node;
            innerArr.node = node//array of indices should have the node
            innerArr.get(0).node = node//add node also to the first digit
        }
        this.compare(LexerToken.Iden)
        return res
    }

    /**
     * Loads arguments of a function
     * @private
     */

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

    /**
     * Compiles bindings of let/letrec expression
     * @private
     */

    private letBindings(): [string[], SECDArray] {
        let res: SECDArray = new SECDArray()//result butecode
        let boundedVariables: Array<string> = []
        switch (this.currTok){
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                let varName = this.lexer.getCurrString()//name of the bound varaible
                this.compare(LexerToken.Iden)
                this.symbTable.add(varName, -2)//We don't node wheather it is a variable or a function
                if(this.currTok == LexerToken.leftBracket)//load the bound expression as string
                    this.letBodys.push('(' + this.lexer.loadExpr(1))
                else
                    this.letBodys.push(this.lexer.loadExpr(0, this.currTok))
                this.currTok = this.lexer.getNextToken()//The loadExpr method loaded tokens but currTok was not updated
                this.compare(LexerToken.rightBracket)
                return this.letBindings()
            case LexerToken.rightBracket:
                //All variables in bindings were loaded, so now parse the expressions
                let parser = new Parser()
                res.node = new CompositeNode([])//All binding will be put into a composite node
                let scopeVars = [... this.symbTable.getVarsInCurrScope()]
                boundedVariables = scopeVars.slice(-this.letBodys.length)
                let i = 0
                this.letBodys.forEach(body => {
                    let letExpr = parser.parse(body, this.symbTable, this.lexer.isMacroExpansion)//parse the expression
                    let node = (letExpr.node instanceof MainNode) ? letExpr.node.node : letExpr.node//If parser returns a MainNode, use its body node
                    letExpr.push(new SECDValue(new Instruction(InstructionShortcut.CONS), node))
                    letExpr.node = res.node
                    res = letExpr.concat(res);//Add binding to the compiled bytecode
                    (res.node as CompositeNode).addItemBack(new BindNode(new VarNode(boundedVariables[i ++] as string), node))//Add binding to the composite node
                })
                this.letBodys = []//crear the array so it can be filled again
                return [boundedVariables, res]
            default:
                throw new ParserError("Unexpected mistake in a let expression")
        }
    }

    /**
     * Compiles expressions inside of a begin statement
     * @private
     */

    private beginBody(): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray
        switch (this.currTok){
            case LexerToken.leftBracket:
                res = this.expr()//Compile expression
                innerArr = this.beginBody()//Move to next expression
                let exprNode = res.node;
                (innerArr.node as CompositeNode).addItemFront(exprNode)// add node of every expression to a composite node
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
        let functionArr = new SECDArray(), functionArgs: SECDArray = new SECDArray()
        if(this.lexer.getCurrString() == "gensym"){//For gensym, special runtime function on indexes -10, -10 will be called
            functionArr.push(new SECDValue(-10))
            functionArr.push(new SECDValue(-10))
            let node = new VarNode("gensym")
            functionArr.node = node
            res.push(new SECDValue(new Instruction(InstructionShortcut.LD), node))
            res.push(functionArr)
            res.node = node
            this.compare(LexerToken.Iden)
            return res
        }
        functionArr = this.expr()
        let isMacro = false
        if(functionArr.node instanceof VarNode &&  this.macros.get(functionArr.node.variable))  {//If it is macro
            this.listElements(true).forEach(element => functionArgs.unshift(element))
            let marcoByteCode = (this.macros.get((functionArr.node as VarNode).variable) as SECDArray).get(1) as SECDArray//We are sure node is VarNode and key in map
            let environment = new SECDArray()//prepare environment for SECD VM
            let globals = new SECDArray()
            environment.push(globals)//add globals list to environment
            environment.push(functionArgs)//add args of the macro
            //add all functions to array of global functions
            this.callable.forEach((val, key) => {
                let res = new SECDArray()
                res.push(environment)
                res.push((val.get(1) as SECDArray).reverse())
                res.node = res.get(1).node
                globals.push(res)//add the function itself to its environment
            })
            
            let interpreter = new Interpreter(marcoByteCode, new TopNode(Array(marcoByteCode.node)), environment)//Run interpreter with macro arguments as environment
            interpreter.run()
            let evaluated = interpreter.state.stack.get(0)//get result
            let parser = new Parser()
            let reducedMacro = evaluated.print()//Print list as String
            res = parser.parse(reducedMacro, this.symbTable, true)//Parse the returned string
            res.node = (res.node as MainNode).node//Get the node of the parsed expression
        }
        else {
            functionArgs = this.listElements(false)
            let argsCnt = -1
            if (functionArr.node instanceof VarNode)//If function has name, look how many args it take
                argsCnt = this.symbTable.getArgsCnt(functionArr.node.variable)
            else if (functionArr.node instanceof LambdaNode)//if local fcw, look on how many args it is called
                argsCnt = (functionArr.node.vars() as CompositeNode).items().length
            if (argsCnt == -1)
                throw new ParserError("Use of uncallable identifier")
            if (argsCnt >= 0 && argsCnt != (functionArgs.node as CompositeNode).items().length)//got unexpected number of arguments
                throw new ParserError("There are " + (functionArgs.node as CompositeNode).items().length + " arguments to a function but " + argsCnt + " are expected")
            let node = new ApplicationNode(functionArr.node, functionArgs.node)
            res.push(new SECDValue(new Instruction(InstructionShortcut.NIL), node))
            res = res.concat(functionArgs)//add compiled arguments
            res = res.concat(functionArr)//add compiled fce
            res.node = node
            res.push(new SECDValue(new Instruction(InstructionShortcut.AP), res.node))
        }
        return res
    }

    /**
     * Compiles arguments of a function/macro call or a list, if it is quoted
     * @param isMacroCall
     * @private
     */

    private listElements(isMacroCall: boolean): SECDArray {
        let tmpArr = new SECDArray(), res: SECDArray = new SECDArray()
        let node: CompositeNode = new CompositeNode(Array())
        if (this.quoted || isMacroCall){//list
            switch (this.currTok) {
                case LexerToken.leftBracket:
                    this.compare(LexerToken.leftBracket)
                    let innerArr = this.listElements(isMacroCall)
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
                    let otherArgs = this.listElements(isMacroCall)
                    node = (<CompositeNode> otherArgs.node)
                    res = res.concat(otherArgs)
                    node.addItemFront(<InnerNode> innerArr.node)
                    break
                case LexerToken.rightBracket:
                    node = new CompositeNode(Array())
                    break
                default:
                    if(isMacroCall)
                        tmpArr = this.val(isMacroCall)//If macro call
                    else {
                        tmpArr = this.expr()//If quoted list
                        tmpArr.push(new SECDValue(new Instruction(InstructionShortcut.CONS), tmpArr.node))
                    }
                    let valNode = tmpArr.node
                    res = this.listElements(isMacroCall)
                    node = (<CompositeNode> res.node)
                    res = tmpArr.concat(res)
                    node.addItemFront(valNode)
                    break
            }
        }
        else {//arguments of fce
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
                    tmpArr.push(new SECDValue(new Instruction(InstructionShortcut.CONS), tmpArr.node))
                    res = this.listElements(isMacroCall)
                    node = (<CompositeNode>res.node)
                    res = res.concat(tmpArr)
                    node.addItemFront(<InnerNode>tmpArr.node)
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
        res.push(new SECDValue(this.lexer.getCurrString(), node))
        res.node = node
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
        res.push(new SECDValue(this.lexer.getCurrNumber(), node))
        res.node = node
        return res
    }

    /**
     * Compiles lambda function
     * @param args - node containing arguments of the lambda
     * @param isCall
     * @private
     */

    private lambdaBody(args: CompositeNode, func: FuncType): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArray: SECDArray
        //if(isCall != 1)//Let statements have their variables alreay in the symbtable
            this.symbTable = this.symbTable.push(new SymbTable(args.items().map(item => (<VarNode>item).variable)))
        if (func == FuncType.MACRO) {//Macros
            //do not add LDF and RTN to macros
            let res = this.expr()
            let node = new CallNode(res.node)
            res.node = node
            this.symbTable = this.symbTable.pop()
            return res
        } 
        else {
            innerArray = this.expr()
            let node
            switch (func) {
                case FuncType.GLOBAL://Functions
                case FuncType.LET://Let
                    node = new CallNode(innerArray.node)
                    break
                case FuncType.LAMBDA://lambda
                default:
                    node = new LambdaNode(args, innerArray.node)
                    break
            }
            res.push(new SECDValue(new Instruction(InstructionShortcut.LDF), node))
            innerArray.push(new SECDValue(new Instruction(InstructionShortcut.RTN), node))
            innerArray.node = node
            res.push(innerArray)
            res.node = node
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
        let res = this.expr()//arg
        let operatorNode = new OperatorNode(instructionShortcut)
        let node = new UnaryExprNode(operatorNode, <InnerNode> res.node)
        res.push(new SECDValue(new Instruction(instructionShortcut), operatorNode))
        res.node = node
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
        let firstArgNode = res.node
        let secondArgNode = innerArr.node
        res = innerArr.concat(res)
        let operatorNode = new OperatorNode(instructionShortcut)
        let node = new BinaryExprNode(firstArgNode, secondArgNode, operatorNode)
        res.push(new SECDValue(new Instruction(instructionShortcut), operatorNode))
        res.node = node
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
        res.get(0).node = res.node//set node of the NIL instruction to the composite node
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
        res.node = new CommaNode(res.node)
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