import {SECDArray} from "../utility/SECD/SECDArray"
import {Instruction} from "../utility/instructions/Instruction";
import {Logger} from "../logger/Logger";
import {SECDValue} from "../utility/SECD/SECDValue";
import {InstructionShortcut} from "../utility/instructions/InstructionShortcut";
import {ColourType} from "../utility/SECD/ColourType";
import {BinaryExprNode, CompositeNode, DefineNode, ReduceNode, FuncNode, IfNode, InnerNode, LambdaNode, LetNode,
    ListNode, MainNode, NullNode, TopNode, ValueNode, VarNode, QuoteNode, UnaryExprNode, BindNode} from "../AST/AST";
import {SECDElement} from "../utility/SECD/SECDElement";
import {SECDElementType} from "../utility/SECD/SECDElementType";
import { InterpreterError } from "./InterpreterErrors";
import { GeneralUtils, Parser } from "..";
import { SECDInvalid } from "../utility/SECD/SECDInvalid";
import { SECDMacro } from "../utility/SECD/SECDMacro";


export class Interpreter{
    set lastInstruction(value: SECDValue) {
        this._lastInstruction = value;
    }
    get lastInstruction(): SECDValue{
        return this._lastInstruction;
    }
    private _lastInstruction: SECDValue
    private logger: Logger
    private readonly _topNode: TopNode
    private cleaned: boolean
    private prevInterpreter: Interpreter | null
    private jumpingToMacro: boolean

    constructor(instructions: SECDArray, topNode: TopNode, macroInterpreter?: Interpreter, environment?: SECDArray) {
        this._code = instructions
        this._stack = new SECDArray()
        this._dump = new SECDArray()
        if(environment)
            this._environment = environment
        else{
            this._environment = new SECDArray()
            this._environment.push(new SECDArray())
        }
        this.logger = new Logger()
        this._lastInstruction = new SECDValue(new Instruction(InstructionShortcut.DUMMY))
        this._topNode = topNode
        this.cleaned = true
        this.jumpingToMacro = false
        this.prevInterpreter = macroInterpreter ? macroInterpreter : null
    }

    get topNode(): TopNode {
        return this._topNode;
    }

    get stack(): SECDArray {
        return this._stack
    }

    set stack(value: SECDArray) {
        this._stack = value
    }

    get code(): SECDArray {
        return this._code
    }

    set code(value: SECDArray) {
        this._code = value
    }

    get dump(): SECDArray {
        return this._dump
    }

    set dump(value: SECDArray) {
        this._dump = value
    }

    get environment(): SECDArray {
        return this._environment
    }

    set environment(value: SECDArray) {
        this._environment = value
    }
    private _stack: SECDArray
    private _code: SECDArray
    private _dump: SECDArray
    private _environment: SECDArray

    protected push(arr: SECDArray, val: string | number | boolean | SECDArray, node?: InnerNode): number{
        if(val == null)
            return -2
        if(val instanceof SECDArray)
            arr.push(val)
        return arr.push(new SECDValue(val as string | number | Instruction, node))
    }

    private cloneArray(arr: SECDArray){
        let other = new SECDArray()
        arr.forEach(item => other.push(item))
        other.node = arr.node
        other.name = arr.name
        return other
    }

    private evaluateUnaryExpression(arr: SECDElement, instructionShortcut: InstructionShortcut, val: SECDValue) {
        this.logger.info("evaluating unary expression on target: " + arr)
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.CONSP:
                let value = arr instanceof SECDArray ? 1 : 0
                let node = new ValueNode(value)
                let element = new SECDValue(value, node)
                val.getNode().update(node, false)//update correct node
                this.stack.push(element)
                break;
            case InstructionShortcut.CAR:
                if(arr instanceof SECDArray && arr.node instanceof CompositeNode) {
                    let node
                    if(arr.node.parent instanceof ReduceNode)
                        node = (arr.node.parent.reduced() as CompositeNode).items()[0]
                    else
                        node = (arr.node as CompositeNode).items()[0]
                    let element = arr.shift()
                    element.node = node
                    this.stack.push(element)
                    arr.node.update(node, false)
                }
                else
                    throw new InterpreterError("Error in interpreter")
                break;
            case InstructionShortcut.CDR:
                let arrClone
                if(arr instanceof SECDArray && arr.node instanceof CompositeNode) {
                    arrClone = new SECDArray(arr)
                    arrClone.shift()
                    let node = arr.node.clone()
                    node.popFront()
                    arr.node.update(node, false)
                }
                else
                   throw new InterpreterError("Error in interpreter")
                this.stack.push(arrClone)
                break;
        }
    }

    private static boolToInt(bool: boolean){
        return bool ? 1 : 0
    }

    private evaluateBinaryExpression(val1: SECDElement, val2: SECDElement, instruction: SECDValue) {
        let num1 = (<SECDValue> val1).val
        let num2 = (<SECDValue> val2).val
        if(typeof num1 != "number" || typeof num2 != "number")
            throw new InterpreterError("Error in interpreter")
        this.logger.info("evaluating binary expression on targets: " + num1 + " and " + num2)
        let instructionShortcut = instruction.val as unknown as InstructionShortcut
        let node;
        let res = 0
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.ADD:
                res = num1 + num2
                break
            case InstructionShortcut.SUB:
                res = num1 - num2
                break
            case InstructionShortcut.MUL:
                res = num1 * num2
                break
            case InstructionShortcut.DIV:
                res = num1 / num2
                break
            case InstructionShortcut.EQ:
                res = Interpreter.boolToInt(num1 == num2)
                break
            case InstructionShortcut.NE:
                res = Interpreter.boolToInt(num1 != num2)
                break
            case InstructionShortcut.LT:
                res = Interpreter.boolToInt(num1 < num2)
                break
            case InstructionShortcut.LE:
                res = Interpreter.boolToInt(num1 <= num2)
                break
            case InstructionShortcut.HT:
                res = Interpreter.boolToInt(num1 > num2)
                break
            case InstructionShortcut.HE:
                res = Interpreter.boolToInt(num1 >= num2)
                break
        }
        this.push(this.stack, res)
        node = new ValueNode(res)
        let element = this.stack.get(this.stack.length() - 1)
        element.node = node
        instruction.getNode().update(node, false)
    }

    private evaluateIf(expr: SECDElement, branch1: SECDElement, branch2: SECDElement, val: SECDValue){
        if(!(branch1 instanceof SECDArray) || !(branch2 instanceof SECDArray) || !(expr instanceof SECDValue))
            throw new InterpreterError("Error in interpreter")
        this.logger.info("evaluating if with condition " + expr + " with branches: " + branch1 + " and " + branch2)
        this.dump.push(this.cloneArray(this.code))
        if(expr.val)
            this._code = this.cloneArray(branch1)
        else
            this._code = this.cloneArray(branch2)
        val.getNode().update(<InnerNode> this._code.getNode(), false)
        this.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
    }

    private evaluateLoad(num1: number, num2: number): SECDElement{
        let x = this.environment.length() - num1 - 1
        let innerArr = this.environment.get(x)
        if(innerArr instanceof SECDArray) {
            let loaded = innerArr.get(innerArr.length() - num2 - 1)
            return loaded
        }
        throw new InterpreterError("Error in interpreter")
    }

    public step(): Interpreter{
        if((this._lastInstruction.val as unknown as Instruction).shortcut !== InstructionShortcut.DUMMY) {
            let step = this.applyInstruction(this._lastInstruction)
            if(step)
                return step
        }
        let code: SECDArray = this.code
        if(code.length() == 0) {
            this.clean()
            if (this.prevInterpreter) {
                this.prevInterpreter.stack.push(this._stack.pop());
                (this.prevInterpreter.lastInstruction.val as unknown as Instruction).shortcut = InstructionShortcut.DUMMY
                return this.prevInterpreter
            }
            else {
                console.log("Result: ", this.stack.get(0))
                return this
            }
        }
        try {
            this._lastInstruction = code.get(0) as SECDValue
            this.colourArray(this._lastInstruction.val as unknown as InstructionShortcut)
        }
        catch (exception){

        }
        return this
    }

    private clean(){
        this._topNode.clean();
        this.code.clearPrinted()
        this.code.clean();
        this.stack.clearPrinted()
        this.stack.clean();
        this.dump.clearPrinted()
        this.dump.clean();
        this.environment.clearPrinted()
        this.environment.clean();
        this.cleaned = true
    }
    
    private colourArray(instructionShortcut: InstructionShortcut){
        let element: SECDElement
        if(!this.cleaned)
            this.clean()
        this.code.get(0).colour = ColourType.Current
        let node: InnerNode
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.LDC:
                element = this.code.get(1);
                element.getNode().setColour(ColourType.Coloured)
                element.colour = ColourType.Coloured
                break
            case InstructionShortcut.LD:
                this.code.get(1).getNode().setColour(ColourType.Current)
                element = this.code.get(1);
                let loaded: SECDElement
                if(element instanceof SECDArray) {
                    element.colour = ColourType.Current
                    loaded = this.evaluateLoad((<SECDValue>(element).get(0)).val as unknown as number,
                        (<SECDValue>(element).get(1)).val as unknown as number)
                    if (loaded.getNode().parent instanceof QuoteNode) {//If it is quoted list colour it all
                        loaded.getNode().parent.colour = ColourType.Coloured
                        loaded.getNode().parent.setColour(ColourType.Coloured)
                    }
                    else {
                        loaded.colour = ColourType.Coloured;
                        loaded.getNode().setColour(ColourType.Coloured)
                    }
                }
                else
                    throw new InterpreterError("Error in interpreter")
                break
            case InstructionShortcut.SEL:
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured
                let ifNode = this.code.get(0).getNode() as IfNode
                ifNode.setColour(ColourType.Current)
                ifNode.condition().setColour(ColourType.Coloured)
                ifNode.left().setColour(ColourType.SecondColoured)
                ifNode.right().setColour(ColourType.ThirdColoured)
                this.code.get(1).colour = ColourType.SecondColoured
                this.code.get(2).colour = ColourType.ThirdColoured
                break
            case InstructionShortcut.JOIN:
                this.dump.get(this.dump.length() - 1).colour = ColourType.Coloured;
                this.code.get(0).getNode().setColour(ColourType.Coloured)
                break
            case InstructionShortcut.NIL:
                break
            case InstructionShortcut.DUM:
                break
            case InstructionShortcut.POP:
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured
                break
            case InstructionShortcut.CONSP:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
                (<UnaryExprNode> this.code.get(0).getNode().parent).expr().setColour(ColourType.Current)
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured;
                break
            case InstructionShortcut.ADD:
            case InstructionShortcut.SUB:
            case InstructionShortcut.MUL:
            case InstructionShortcut.DIV:
            case InstructionShortcut.EQ:
            case InstructionShortcut.NE:
            case InstructionShortcut.LT:
            case InstructionShortcut.LE:
            case InstructionShortcut.HT:
            case InstructionShortcut.HE:
                this.code.get(0).getNode().setColour(ColourType.Current);
                (<BinaryExprNode> this.code.get(0).getNode().parent).left().setColour(ColourType.Coloured);
                (<BinaryExprNode> this.code.get(0).getNode().parent).right().setColour(ColourType.SecondColoured);
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured
                this.stack.get(this.stack.length() - 2).colour = ColourType.SecondColoured
                break
            case InstructionShortcut.CONS:
            case InstructionShortcut.CONC:/*
                let secondOnstack = this.stack.get(this.stack.length() - 2)
                if(secondOnstack instanceof SECDArray)
                    if(secondOnstack.length() == 0)
                        secondOnstack.node = this.code.get(0).node//If cons called on empty array without node it should be coloured*/
                this.code.get(0).getNode().setColour(ColourType.Coloured)
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured
                this.stack.get(this.stack.length() - 2).colour = ColourType.SecondColoured;
                break
            case InstructionShortcut.LDF:
                this.code.get(1).colour = ColourType.Coloured;
                this.code.get(1).getNode().setColour(ColourType.Coloured)
                break
            case InstructionShortcut.AP:
                element = this.stack.get(this.stack.length() - 1)
                element.colour = ColourType.Current
                node = element.getNode()
                node.setColour(ColourType.Current);
                if(node.parent instanceof FuncNode) {
                    //Normal non recursive lambdas
                    //Here argument will be highlited even if it is variable in code
                    let args = (node.parent as FuncNode).args()
                    if(args instanceof ReduceNode)
                        (args.reduced() as CompositeNode).items().forEach(node => node.setColour(ColourType.Coloured))
                    else
                        (args as CompositeNode).items().forEach(node => node.setColour(ColourType.Coloured))
                }
                else {
                    //For lambdas defined without argument immediatly following them
                    //If argument is list colour it whole
                    if(this.stack.get(this.stack.length() - 2).node instanceof QuoteNode)
                        this.stack.get(this.stack.length() - 2).node.setColour(ColourType.Coloured)
                    //Because of recursive functions where argument is in code just once
                    else
                        (<SECDArray> this.stack.get(this.stack.length() - 2)).forEach(element => element.getNode().setColour(ColourType.Coloured));
                }
                (<SECDArray> this.stack.get(this.stack.length() - 2)).forEach(element => element.colour = ColourType.Coloured);
                break
            case InstructionShortcut.RAP:
                this.stack.get(this.stack.length() - 1).colour = ColourType.Current
                this.stack.get(this.stack.length() - 1).getNode().colour = ColourType.Current
                this.stack.get(this.stack.length() - 2).colour = ColourType.Coloured
                this.stack.get(this.stack.length() - 2).getNode().colour = ColourType.Coloured
                break
            case InstructionShortcut.RTN:
                this.stack.get(this.stack.length() - 1).colour = ColourType.Current;
                this.code.get(this.code.length() - 1).getNode().setColour(ColourType.Current)
                this.dump.get(this.dump.length() - 2).colour = ColourType.ThirdColoured
                this.dump.get(this.dump.length() - 3).colour = ColourType.SecondColoured
                this.dump.get(this.dump.length() - 4).colour = ColourType.Coloured
                break
            case InstructionShortcut.DEFUN:
                this.code.get(0).getNode().setColour(ColourType.Current)
                this.stack.get(0).colour = ColourType.Current
                break
            case InstructionShortcut.STOP:
                break
            default:
                throw new InterpreterError("Error in interpreter")
        }
        this.cleaned = false
    }

    private applyInstruction(val: SECDValue): Interpreter | null{
        let instructionShortcut = val.val as unknown as InstructionShortcut
        let currNode = this.code.get(0).getNode()
        this.code.shift()
        let node2: InnerNode, newNode: InnerNode
        let varNode: VarNode
        let tmpArr = new SECDArray()
        let tmpArr2: SECDArray = new SECDArray(), closure
        let invalid: SECDInvalid
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.LDC:
                tmpArr.push(this.code.shift())
                this.stack.push(tmpArr.get(0))
                break
            case InstructionShortcut.LD:
                varNode = <VarNode> this.code.get(0).getNode()
                tmpArr.push(this.code.shift())
                closure = tmpArr.get(0) as SECDArray
                let loaded = this.evaluateLoad((<SECDValue>closure.get(0)).val as unknown as number, (<SECDValue> closure.get(1)).val as unknown as number)
                if(loaded.getNode().isLeaf()) {
                    //Last element of array should always have node that is parent of nodes of pervious elements
                    node2 = <InnerNode>this.code.get(this.code.length() - 1).getNode();
                    newNode = loaded.getNode().clone()
                    node2.loadVariable(varNode.variable, newNode)
                    if (loaded instanceof SECDValue){
                        this.logger.info("loading value: " + loaded)
                        this.stack.push(new SECDValue(loaded.val as unknown as number | string, newNode))
                    }
                    else {//Loading list
                        this.logger.info("loading array")
                        this.stack.push(loaded)
                    }
                }
                else {
                    this.logger.info("loading array")
                    node2 = <InnerNode> tmpArr.get(0).getNode();
                    newNode = loaded.getNode().deapCopy()
                    if(node2.parent instanceof LetNode)
                        node2.loadVariable(varNode.variable, newNode)// If recursive function called for the first time
                    this.stack.push(loaded)
                }
                break
            case InstructionShortcut.SEL:
                this.evaluateIf(this.stack.pop(), this.code.shift(), this.code.shift(), val)
                break
            case InstructionShortcut.JOIN:
                this._code = this.dump.pop() as SECDArray
                break
            case InstructionShortcut.NIL:
                //this.logger.info("loading empty list")
                tmpArr = new SECDArray()
                this.stack.push(tmpArr)
                break
            case InstructionShortcut.DUM:
                tmpArr = new SECDArray()
                this.environment.push(tmpArr)
                break
            case InstructionShortcut.POP:
                this.stack.pop()
                break
            case InstructionShortcut.CONSP:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
                this.evaluateUnaryExpression(this.stack.pop(), instructionShortcut, val)
                break
            case InstructionShortcut.ADD:
            case InstructionShortcut.SUB:
            case InstructionShortcut.MUL:
            case InstructionShortcut.DIV:
            case InstructionShortcut.EQ:
            case InstructionShortcut.NE:
            case InstructionShortcut.LT:
            case InstructionShortcut.LE:
            case InstructionShortcut.HT:
            case InstructionShortcut.HE:
                this.evaluateBinaryExpression(this.stack.pop(), this.stack.pop(), val)
                break
            case InstructionShortcut.CONS:/*
                let secondOnstack = this.stack.get(this.stack.length() - 2)
                if(secondOnstack instanceof SECDArray)
                    if(secondOnstack.length() == 0)
                        secondOnstack.node = new NullNode()//If we added node to empty array, remove it*/
                tmpArr.push(this.stack.pop())
                let tmpArr2 = this.stack.pop()
                if(!(tmpArr2 instanceof SECDArray)) {
                    throw new InterpreterError("")
                }
                if(tmpArr2.length() == 0 && ! (val.node instanceof QuoteNode)) {
                    tmpArr2.push(tmpArr.pop())
                    tmpArr2.node = tmpArr.node
                }
                else {//If composide node
                    tmpArr2.node = tmpArr.getNode().parent as InnerNode
                    tmpArr2.push(tmpArr.pop())
                }
                this.stack.push(tmpArr2)
                break
            case InstructionShortcut.CONC:
                tmpArr.push(this.stack.pop())
                let macroArr = this.stack.pop()
                if(!(macroArr instanceof SECDArray)) {
                    throw new InterpreterError("")
                }
                if(macroArr.get(0) instanceof SECDMacro && tmpArr.get(0) instanceof SECDMacro){
                    (macroArr.get(0) as SECDMacro).add(tmpArr.get(0) as SECDMacro)
                    this.stack.push(macroArr)
                    break
                }
                if(macroArr.length() == 0 && ! (val.node instanceof QuoteNode)) {
                    macroArr.push(tmpArr.pop())
                    macroArr.node = tmpArr.node
                }
                else {//If composide node
                    macroArr.node = tmpArr.getNode().parent as InnerNode
                    macroArr.push(tmpArr.pop())
                }
                this.stack.push(macroArr)
                break
            case InstructionShortcut.LDF:
                tmpArr.push(this.code.shift())
                tmpArr.push(this.environment)
                //tmpArr.push(this.cloneArray(this.environment))
                //tmpArr.get(1).setNode(this.code.get(this.code.length() - 1).getNode())
                this.logger.info("loading function: " + tmpArr.get(0)  /*+ " in environment: " + tmpArr[1]*/)
                tmpArr.node = tmpArr.get(0).getNode()
                tmpArr.isClosure = true
                this.stack.push(tmpArr)
                break
            case InstructionShortcut.AP:
                tmpArr.push(this.stack.pop())
                tmpArr.push(this.stack.pop())
                closure = tmpArr.get(0) as SECDArray
                this.dump.push(this.cloneArray(this.stack))//save stack to dump
                this.dump.push(this.cloneArray(this.code))//save code to dump
                this.dump.push(this.cloneArray(this.environment))//save environment to dump
                invalid = new SECDInvalid()//Representing function before entering this new one
                //invalid.node = tmpArr3.node
                if(closure.node instanceof LambdaNode || closure.node instanceof DefineNode) {//If applying recursive function
                    invalid.node = closure.node.body()

                    invalid.otherNode = currNode
                    invalid.otherNode.removeReduction()
                }
                this.dump.push(invalid)
                this.code        = this.cloneArray(closure.get(0) as SECDArray)
                this.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
                this.environment = this.cloneArray(closure.get(1) as SECDArray)
                this.environment.push(tmpArr.get(1))
                this.stack.clear()
                this.logger.info("Applying function: " + this.code + " with arguments: " + this.environment + "")
                this.clean()
                if(closure.node instanceof LambdaNode) {
                    closure.node.removeReduction()
                }
                this.code.removeReduction()//Fix node parent when entering new function
                //this.stack.removeReduction()
                //this.environment.removeReduction()
                break
            case InstructionShortcut.RAP:
                tmpArr.push(this.stack.pop())
                tmpArr.push(this.stack.pop())
                tmpArr.node = tmpArr.get(1).getNode()
                this._environment.arr[this.environment.length() - 1] = tmpArr.get(1)
                tmpArr.push(this.environment.pop())
                this.dump.push(this.cloneArray(this.stack))
                this.dump.push(this.cloneArray(this.code))
                this.dump.push(this.cloneArray(this.environment))
                this.environment.push(tmpArr.pop())
                closure = tmpArr.get(0) as SECDArray;
                invalid = new SECDInvalid()
                invalid.node = closure.node.clone()
                this.dump.push(invalid)
                //(<SECDArray> tmpArr.get(tmpArr.length() - 1)).name = GeneralUtils.getFunctionName(tmpArr3.getNode())
                this.code        = this.cloneArray(closure.get(0) as SECDArray)
                this.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
                /*closure.node.removeReduction()
                this.code.removeReduction()//Fix node parent when entering new function
                this.stack.removeReduction()*/
                this.stack.clear()
                this.logger.info("Applying recursive function: " + this.code + " with arguments: " + this.environment + "")
                break
            case InstructionShortcut.RTN:
                let tmp = this.stack.pop()
                tmp = tmp.clone()
                tmpArr.push(tmp)
                invalid = this.dump.pop() as SECDInvalid
                this.stack       = new SECDArray()
                this.environment = new SECDArray()
                this.code        = new SECDArray()
                this.environment = this.environment.concat(this.dump.pop() as SECDArray) as SECDArray
                this.code        = this.code.concat(this.dump.pop() as SECDArray) as SECDArray
                this.stack       = this.stack.concat(this.dump.pop() as SECDArray) as SECDArray

                if(invalid.node instanceof ReduceNode)
                    invalid.node.reduced().removeReduction()
                invalid.otherNode.update(<InnerNode> tmpArr.get(0).getNode(), true);//update function node on place where it was called
                (invalid.otherNode.parent as InnerNode)._returned = true
                this.stack.push(tmpArr.get(0))
                this.logger.info("Returning from function, result: " + tmpArr.get(0))
                break
            case InstructionShortcut.DEFUN:
                if(this.environment.get(0) instanceof SECDArray) {
                    let node = val.getNode()
                    this.stack.get(this.stack.length() - 1).node = node;
                    (<SECDArray>this.environment.get(0)).push(this.stack.pop())
                    //this.environment.get(0).node = node
                }
                else
                    throw new InterpreterError("Error in interpreter")
                break
            case InstructionShortcut.STOP:
                break
            case InstructionShortcut.MACRO:
                let parser = new Parser()
                let macro = parser.parse(((this.stack.pop() as SECDArray).pop() as SECDMacro).macro)
                return new Interpreter(macro, parser.topNode as TopNode, this, this.environment)
            default:
                throw new InterpreterError("Error in interpreter")
        }
        return null
    }
}