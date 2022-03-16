import {LexerToken} from "../lexer/LexerTokens"
import {Lexer} from "../lexer/Lexer"
import {Instruction} from "../utility/instructions/Instruction"
import {SymbTable} from "./SymbTable"
import {SECDArray} from "../utility/SECD/SECDArray"
import {SECDValue} from "../utility/SECD/SECDValue"
import {InstructionShortcut} from "../utility/instructions/InstructionShortcut"
import {
    BeginNode,
    BinaryExprNode, CallNode,
    CommaNode,
    CompositeNode,
    DefineNode,
    FuncNode,
    IfNode,
    InnerNode,
    LambdaNode, LetNode,
    MainNode,
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


export class Parser{
    get topNode(): TopNode | null {
        return this._topNode;
    }
    symbTable: SymbTable
    quoted: boolean
    macros: Array<string>
    lexer!: Lexer
    currTok!: LexerToken | null
    private _topNode!: TopNode | null

    constructor() {
        this.symbTable = new SymbTable([])
        this.macros = Array()
        this.quoted = false
    }

    protected compare(tok: LexerToken){
        if(this.currTok == tok)
            this.currTok = this.lexer.getNextToken()
        else
            throw new SyntaxError("Syntax error")
    }
    
    protected push(arr: SECDArray, val: string | number | Instruction | SECDArray): number{
        if(val == null)
            return -2
        if(val instanceof SECDArray)
            return arr.push(val)
        return arr.push(new SECDValue(val))
    }

    parse(input: string): SECDArray{
        this.lexer = new Lexer(input)
        return this.loadInstructions()
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
                this.symbTable.addFront(name)
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                compositeNode = new CompositeNode(args.map(arg => new VarNode(arg)))
                this.compare(LexerToken.rightBracket)
                res = this.lambda(compositeNode, 2)
                res.initializeNode()//Move node level above in array
                node = new DefineNode(name, new CompositeNode(args.map(arg => new VarNode(arg))), res.getNode())
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
                this.symbTable.addFront(name)
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.leftBracket)
                args = this.args()
                compositeNode = new CompositeNode(args.map(arg => new VarNode(arg)))
                this.compare(LexerToken.rightBracket)
                res = this.lambda(compositeNode, 2)
                res.initializeNode()//Move node level above in array
                node = new DefineNode(name, new CompositeNode(args.map(arg => new VarNode(arg))), res.getNode(), true)
                this.macros.push(name)
                res.push(new SECDValue(new Instruction(InstructionShortcut.DEFUN), node))
                res.get(0).node = node
                res.get(1).node = node
                arr = res.get(1) as SECDArray
                arr.get(arr.length() - 1).node = node//SET RTN instruction to Define node
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
                res = this.expr_body()
                node = new MainNode(<InnerNode> res.getNode())
                break
        }
        return [res, node]
    }

    protected expr(): SECDArray {
        let res: SECDArray = new SECDArray(), tmpArr = new SECDArray()
        let inBody = false
        switch (this.currTok) {
            case LexerToken.leftBracket:
                this.compare(LexerToken.leftBracket)
                inBody = true
                res = this.expr_body()
                this.compare(LexerToken.rightBracket)
                break
            case LexerToken.backQuote:
                this.compare(LexerToken.backQuote)
                this.compare(LexerToken.leftBracket)
                res = this.compileQuote()
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
                res = this.val()
                if(this.quoted) {
                    let tmp = res
                    res = new SECDArray()
                    res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), tmp.node))
                    res.push(tmp)
                }
                break
            default:
                throw new ParserError("Invalid expression")
        }
        return res
    }

    protected expr_body(): SECDArray {
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
                res = res.concat(innerRes[1])
                this.push(res, InstructionShortcut[InstructionShortcut.CONS])
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))
                res = res.concat(this.lambda(compositeNode))
                this.push(res, InstructionShortcut[InstructionShortcut.AP])
                break
            case LexerToken.letrec:
                this.compare(LexerToken.letrec)
                this.compare(LexerToken.leftBracket)
                innerRes = this.letBody()
                res.push(new SECDValue(new Instruction(InstructionShortcut.DUM), innerRes[1].getNode()))
                res = res.concat(innerRes[1])
                res.push(new SECDValue(new Instruction(InstructionShortcut.CONS), res.getNode()))
                this.compare(LexerToken.rightBracket)
                compositeNode = new CompositeNode(innerRes[0].map(arg => new VarNode(arg)))
                innerArr = this.lambda(compositeNode, 1)
                res = res.concat(innerArr)
                node = new LetNode(compositeNode, res.getNode(), innerArr.getNode(), true)
                res.push(new SECDValue(new Instruction(InstructionShortcut.RAP), innerArr.getNode()))
                res.node = node
                break
            case LexerToken.lambda:
                this.compare(LexerToken.lambda)
                this.compare(LexerToken.leftBracket)
                args = this.args()
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
                this.push(res, innerArr)
                innerArr2.push(new SECDValue(new Instruction(InstructionShortcut.JOIN), node))
                this.push(res, innerArr2)
                res.node = node
                break
            case LexerToken.begin:
                this.compare(LexerToken.begin)
                res = this.beginBody()
                res.pop()
                res.node = new BeginNode(res.node as CompositeNode)
                break
            case LexerToken.printf://TODO
                this.compare(LexerToken.printf)
                this.compare(LexerToken.Str)
                this.args()
                break
            case LexerToken.plus:
                this.compare(LexerToken.plus)
                res = this.compileBinaryOperator(InstructionShortcut.ADD)
                break
            case LexerToken.minus:
                this.compare(LexerToken.minus)
                res = this.compileBinaryOperator(InstructionShortcut.SUB)
                break
            case LexerToken.times:
                this.compare(LexerToken.times)
                res = this.compileBinaryOperator(InstructionShortcut.MUL)
                break
            case LexerToken.division:
                this.compare(LexerToken.division)
                res = this.compileBinaryOperator(InstructionShortcut.DIV)
                break
            case LexerToken.lt:
                this.compare(LexerToken.lt)
                res = this.compileBinaryOperator(InstructionShortcut.LT)
                break
            case LexerToken.le:
                this.compare(LexerToken.le)
                res = this.compileBinaryOperator(InstructionShortcut.LE)
                break
            case LexerToken.eq:
                this.compare(LexerToken.eq)
                res = this.compileBinaryOperator(InstructionShortcut.EQ)
                break
            case LexerToken.he:
                this.compare(LexerToken.he)
                res = this.compileBinaryOperator(InstructionShortcut.HE)
                break
            case LexerToken.ht:
                this.compare(LexerToken.ht)
                res = this.compileBinaryOperator(InstructionShortcut.HT)
                break
            case LexerToken.or:
                this.compare(LexerToken.or)
                res = this.compileBinaryOperator(InstructionShortcut.OR)
                break
            case LexerToken.and:
                this.compare(LexerToken.and)
                res = this.compileBinaryOperator(InstructionShortcut.AND)
                break
            case LexerToken.car:
                this.compare(LexerToken.car)
                res = this.compileUnaryOperator(InstructionShortcut.CAR)
                break
            case LexerToken.cdr:
                this.compare(LexerToken.cdr)
                res = this.compileUnaryOperator(InstructionShortcut.CDR)
                break
            case LexerToken.consp:
                this.compare(LexerToken.consp)
                res = this.compileUnaryOperator(InstructionShortcut.CONSP)
                break
            case LexerToken.Iden:
            case LexerToken.leftBracket:
                res = this.functionCall()
                innerArr = new SECDArray()
                innerArr.push(new SECDValue(new Instruction(InstructionShortcut.AP), (<FuncNode> res.getNode()).func()))
                innerArr.get(0).node = res.node
                res = res.concat(innerArr)
                break
        }
        return res
    }

    protected val(): SECDArray {
        let res: SECDArray = new SECDArray()
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
                this.compare(LexerToken.Iden)
                break
            case LexerToken.null:
                this.compare(LexerToken.null)
                break
            case LexerToken.quote:
                this.compare(LexerToken.quote)
                res = this.compileQuote()
                break
            case LexerToken.backQuote:
                this.compare(LexerToken.backQuote)
                this.compare(LexerToken.leftBracket)
                res = this.compileQuote()
                this.compare(LexerToken.rightBracket)
                break
            default:
                throw new ParserError("Unknown lexer token")
        }
        return res
    }

    protected iden(): SECDArray {
        let res: SECDArray = new SECDArray()
        let node = new VarNode(this.lexer.getCurrString())
        res.push(new SECDValue(new Instruction(InstructionShortcut.LD), node))
        let innerArr = this.symbTable.getPos(this.lexer.getCurrString())
        if((innerArr.get(0) as SECDValue).val as unknown as number < 0 || (innerArr.get(1) as SECDValue).val as unknown as number < 0)
            throw new ParserError("Unknown identifier")
        res.push(innerArr)
        res.setNode(node);
        innerArr.get(0).setNode(innerArr.get(1).getNode())//add node also to first digit
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
                this.symbTable = this.symbTable.push(
                    new SymbTable([arg]))
                this.compare(LexerToken.Iden)
                this.compare(LexerToken.rightBracket)
                this.compare(LexerToken.leftBracket)
                res = this.functionCall()
                this.compare(LexerToken.rightBracket)
                this.symbTable = this.symbTable.pop()
                innerRes = this.letBody()
                args = innerRes[0]
                innerArr = innerRes[1]
                args.push(arg)
                if(!innerArr.empty())
                    this.push(res, innerArr)
                break
            case LexerToken.rightBracket:
                break
        }
        return [args, res]
    }

    protected beginBody(): SECDArray {
        let res: SECDArray = new SECDArray()
        let innerArr: SECDArray = new SECDArray()
        switch (this.currTok){
            case LexerToken.leftBracket:
                res = this.expr()
                innerArr = this.beginBody()
                let node = res.node;
                (innerArr.node as CompositeNode).addItemFront(node)
                res = innerArr.concat(res)
                res.push(new SECDValue(new Instruction(InstructionShortcut.POP), node))
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
        if(innerArr.node instanceof VarNode)//If it is macro
            if(this.macros.indexOf(innerArr.node.variable) >= 0)
                isMacro = true
        innerArr2 = this.functionArgs(isMacro)
        let node = (<CompositeNode> innerArr2.getNode()).items().length == 0
            ? innerArr.getNode()//TODO can this really happen?
            : new FuncNode(<InnerNode> innerArr.getNode(), <InnerNode> innerArr2.getNode())
        res.push(new SECDValue(new Instruction(InstructionShortcut.NIL), node))
        res = res.concat(innerArr2)
        res.node = node//This is important
        res = res.concat(innerArr)
        return res
    }

    protected functionArgs(isMacro: boolean): SECDArray {
        let tmpArr = new SECDArray(), res: SECDArray = new SECDArray()
        let node: CompositeNode = new CompositeNode(Array())
        switch (this.currTok){
            case LexerToken.leftBracket:
            case LexerToken.null:
            case LexerToken.Iden:
            case LexerToken.Str:
            case LexerToken.Bool:
            case LexerToken.Num:
            case LexerToken.quote:
            case LexerToken.comma:
                if(isMacro) {
                    res = this.expr()
                    tmpArr.push(new SECDValue(new Instruction(InstructionShortcut.LDC), res.node))
                    tmpArr.push(res)
                }
                else
                    tmpArr = tmpArr.concat(this.expr())
                tmpArr.push(new SECDValue(new Instruction(InstructionShortcut.CONS), tmpArr.getNode()))
                res = this.functionArgs(isMacro)
                node = (<CompositeNode> res.getNode())
                res = tmpArr.concat(res)
                node.addItemFront(<InnerNode> tmpArr.getNode())
                break
            case LexerToken.rightBracket:
                node = new CompositeNode(Array())
                break
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

    protected lambda(args: CompositeNode, isCall: number = 0): SECDArray{
        let res: SECDArray = new SECDArray()
        let innerArray: SECDArray
        this.symbTable = this.symbTable.push(new SymbTable(args.items().map(item => (<VarNode> item).variable)))
        innerArray = this.expr()
        let node
        switch(isCall) {
            case 2:
                node = new CallNode(innerArray.getNode())
                break
            case 1:
                node = innerArray.getNode()
                break
            case 0:
            default:
                node = new LambdaNode(args, <InnerNode>innerArray.getNode())
                break
        }
        res.push(new SECDValue(new Instruction(InstructionShortcut.LDF), node))
        innerArray.push(new SECDValue(new Instruction(InstructionShortcut.RTN), node))
        innerArray.setNode(node)
        this.push(res, innerArray)
        this.symbTable = this.symbTable.pop()
        return res
    }
/*
    protected compileQuote(){
        let res: SECDArray = new SECDArray()
        let arr = this.lexer.loadQuotedValue()
        let node = arr.toListNode()
        res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
        arr.node = node
        res.push(arr)
        res.setNode(node)
        this.currTok = this.lexer.getNextToken()
        return res
    }*/

    protected compileUnaryOperator(instructionShortcut: InstructionShortcut): SECDArray{
        let res = this.expr()
        let node = new UnaryExprNode(new OperatorNode(instructionShortcut), <InnerNode> res.getNode())
        res.push(new SECDValue(new Instruction(instructionShortcut), node))
        res.setNode(node)
        return res
    }

    protected compileBinaryOperator(instructionShortcut: InstructionShortcut): SECDArray{
        let res = this.expr()//First argument
        let innerArr = this.expr()//Second argument
        let firstArgNode = res.getNode()
        let secondArgNode = innerArr.getNode()
        res = innerArr.concat(res)
        let node = new BinaryExprNode(firstArgNode, secondArgNode, new OperatorNode(instructionShortcut))
        if(this.quoted)//If quoted just load the operator
            res.push(new SECDValue(new Instruction(InstructionShortcut.LDC), node))
        res.push(new SECDValue(new Instruction(instructionShortcut), node))
        res.setNode(node)
        return res
    }
    
    
    protected compileQuote(): SECDArray{
        this.quoted = true
        let res = new SECDArray()
        res = res.concat(this.functionArgs(false))
        this.quoted = false
        res.node = new QuoteNode(res.node)
        return res
    }

    protected compileComma(): SECDArray{
        this.compare(LexerToken.comma)
        this.quoted = false
        let res = this.expr()
        this.quoted = true
        res.node = new CommaNode(res.node)
        return res
    }

    protected createNode(element: SECDElement): InnerNode{
        if(element instanceof SECDArray) {
            let node = new CompositeNode(element.map(element => this.createNode(element)))
            element.node = node
            return node
        }
        if (element instanceof SECDValue){
            if(typeof(element.val) == "number") {
                let node = new ValueNode(element.val)
                element.setNode(node)
                return node
            }
        }
        throw new ParserError("Error in parser")
    }
}