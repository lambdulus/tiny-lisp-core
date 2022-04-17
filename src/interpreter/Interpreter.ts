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
import { SECDHidden } from "../utility/SECD/SECDHidden";
import { SECDMacro } from "../utility/SECD/SECDMacro";
import { InterpreterState } from "./InterpreterState";


export class Interpreter{
    get state(): InterpreterState{
        return this._state;
    }
    set lastInstruction(value: Instruction) {
        this._lastInstruction = value;
    }
    get lastInstruction(): Instruction{
        return this._lastInstruction;
    }
    private _lastInstruction: Instruction
    private lastInstructionNode: InnerNode
    private logger: Logger
    public finished: boolean
    private _state: InterpreterState

    constructor(instructions: SECDArray, topNode: TopNode, environment?: SECDArray) {
        this._state = new InterpreterState(instructions, topNode, environment)
        this.logger = new Logger()
        this._lastInstruction = new Instruction(InstructionShortcut.DUMMY)
        this.lastInstructionNode = new NullNode()
        this.finished = false
    }



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

    private evaluateUnaryExpression(arr: SECDElement, instructionShortcut: InstructionShortcut, instructionNode: InnerNode) {
        this.logger.info("evaluating unary expression on target: " + arr)
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut.CONSP:
                let value = arr instanceof SECDArray ? 1 : 0
                let node = new ValueNode(value)
                let element = new SECDValue(value, node)
                instructionNode.update(node, false)//update instruction node
                this._state.stack.push(element)
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
                    this._state.stack.push(element)
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
                this._state.stack.push(arrClone)
                break;
        }
    }

    /**
     * Converts boolean valu to number one
     * @param bool
     * @private
     */

    private static boolToInt(bool: boolean){
        return bool ? 1 : 0
    }

    /**
     * Computes result of operation on 2 SECDElements and pushes result on stack
     * @param val1
     * @param val2
     * @param instruction
     * @private
     */

    private evaluateBinaryExpression(val1: SECDElement, val2: SECDElement, instructionShortcut: InstructionShortcut, instructionNode: InnerNode) {
        let num1 = (<SECDValue> val1).constant
        let num2 = (<SECDValue> val2).constant
        if(typeof num1 != "number" || typeof num2 != "number")
            throw new InterpreterError("Binary operator expects 2 number values")
        this.logger.info("evaluating binary expression on targets: " + num1 + " and " + num2)
        let node;
        let res = 0
        //@ts-ignore
        switch (instructionShortcut) {
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
        this._state.stack.push(new SECDValue(res))
        node = new ValueNode(res)
        let element = this._state.stack.get(this._state.stack.length() - 1)
        element.node = node
        instructionNode.parent.update(node, false)
    }

    private evaluateIf(expr: SECDElement, branch1: SECDElement, branch2: SECDElement, ifNode: IfNode){
        if(!(branch1 instanceof SECDArray) || !(branch2 instanceof SECDArray) || !(expr instanceof SECDValue))
            throw new InterpreterError("Error in interpreter")
        this.logger.info("evaluating if with condition " + expr + " with branches: " + branch1 + " and " + branch2)
        this._state.dump.push(this.cloneArray(this._state.code))
        let cond = expr.constant
        if(typeof (cond) != "number")
            throw new InterpreterError("Element on top of the stack is not a number")
        if(cond as number) {
            this._state.code = this.cloneArray(branch1)
            ifNode.chosenBranch = 1
        }
        else {
            this._state.code = this.cloneArray(branch2)
            ifNode.chosenBranch = 2
        }
        //ifNode.update(<InnerNode> this._state.code.getNode(), false)//Update result of if statement
        this._state.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
    }

    static evaluateLoad(environment: SECDArray, num1: number, num2: number): SECDElement{
        let x = environment.length() - num1 - 1
        let innerArr = environment.get(x)
        if(innerArr instanceof SECDArray) {
            let loaded = innerArr.get(innerArr.length() - num2 - 1)
            return loaded.clone()
        }
        throw new InterpreterError("Error in interpreter")
    }

    public step(): void{
        if((this._lastInstruction).shortcut !== InstructionShortcut.DUMMY) {
            this.applyInstruction(this._lastInstruction.shortcut, this.lastInstructionNode)
        }
        let code: SECDArray = this._state.code
        if(code.length() == 0) {
            console.log("Result: ", this._state.stack.get(0))
            this.finished = true
            return
        }
        try {
            let lastConstant = (code.get(0) as SECDValue).constant
            if(!(lastConstant instanceof Instruction))
                throw new InterpreterError("Element on top of code register is not instruction")
            this._lastInstruction = lastConstant
            this.lastInstructionNode = code.get(0).getNode()
        }
        catch (exception){

        }
    }

    public run(){
        while(!this.finished)
            this.step()
    }

    private applyInstruction(instructionShortcut: InstructionShortcut, node: InnerNode): Interpreter | null{
        let currNode = this._state.code.get(0).getNode()
        this._state.code.shift()
        let node2: InnerNode, newNode: InnerNode
        let varNode: VarNode
        let tmpArr = new SECDArray()
        let tmpArr2: SECDArray = new SECDArray(), indexesList, tmpArr3: SECDArray
        let invalid: SECDHidden
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut.LDC:
                tmpArr.push(this._state.code.shift())
                this._state.stack.push(tmpArr.get(0))
                break
            case InstructionShortcut.LD:
                varNode = <VarNode> this._state.code.get(0).getNode()
                tmpArr.push(this._state.code.shift())
                indexesList = tmpArr.get(0)
                if(!(indexesList instanceof SECDArray))
                    throw new InterpreterError("LD is not followed by list of indexes")
                let index1 = indexesList.get(0)
                let index2 = indexesList.get(1)
                if(!(index1 instanceof SECDValue && index2 instanceof SECDValue))
                    throw new InterpreterError("LD indexes must be values")
                let val1 = index1.constant
                let val2 = index2.constant
                if((typeof (val1) != "number") && (typeof (val2) != "number"))
                    throw new InterpreterError("LD indexes are not numbers")
                let loaded = Interpreter.evaluateLoad(this._state.environment, val1 as unknown as number, val2 as unknown as number)
                if(loaded.getNode().isLeaf()) {
                    //Last element of array should always have node that is parent of nodes of pervious elements
                    node2 = <InnerNode> this._state.code.get(this._state.code.length() - 1).getNode();
                    newNode = loaded.getNode().clone()
                    node2.loadVariable(varNode.variable, newNode)
                    if (loaded instanceof SECDValue){
                        this.logger.info("loading value: " + loaded)
                        this._state.stack.push(new SECDValue(loaded.constant as unknown as string | number | Instruction, newNode))
                    }
                    else {//Loading list
                        this.logger.info("loading array")
                        this._state.stack.push(loaded)
                    }
                }
                else {
                    this.logger.info("loading array")
                    node2 = <InnerNode> tmpArr.get(0).getNode();
                    newNode = loaded.getNode().deapCopy()
                    if(node2.parent instanceof LetNode)
                        node2.loadVariable(varNode.variable, newNode)// If recursive function called for the first time
                    this._state.stack.push(loaded)
                }
                break
            case InstructionShortcut.SEL:
                this.evaluateIf(this._state.stack.pop(), this._state.code.shift(), this._state.code.shift(), node as IfNode)
                break
            case InstructionShortcut.JOIN:
                this._state.code = this._state.dump.pop() as SECDArray
                break
            case InstructionShortcut.NIL:
                //this.logger.info("loading empty list")
                tmpArr = new SECDArray()
                this._state.stack.push(tmpArr)
                break
            case InstructionShortcut.DUM:
                tmpArr = new SECDArray()
                this._state.environment.push(tmpArr)
                break
            case InstructionShortcut.POP:
                this._state.stack.pop()
                break
            case InstructionShortcut.CONSP:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
                this.evaluateUnaryExpression(this._state.stack.pop(), instructionShortcut, node)
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
                this.evaluateBinaryExpression(this._state.stack.pop(), this._state.stack.pop(), instructionShortcut, node)
                break
            case InstructionShortcut.CONS:/*
                let secondOnstack = this.stack.get(this.stack.length() - 2)
                if(secondOnstack instanceof SECDArray)
                    if(secondOnstack.length() == 0)
                        secondOnstack.node = new NullNode()//If we added node to empty array, remove it*/
                tmpArr.push(this._state.stack.pop())
                let tmpArr2 = this._state.stack.pop()
                if(!(tmpArr2 instanceof SECDArray)) {
                    throw new InterpreterError("")
                }
                if(tmpArr2.length() == 0 && ! (node instanceof QuoteNode)) {
                    tmpArr2.push(tmpArr.pop())
                    tmpArr2.node = tmpArr.node
                }
                else {//If composide node
                    tmpArr2.node = tmpArr.getNode().parent as InnerNode
                    tmpArr2.push(tmpArr.pop())
                }
                this._state.stack.push(tmpArr2)
                break
            case InstructionShortcut.LDF:
                tmpArr.push(this._state.code.shift())
                tmpArr.push(this._state.environment)
                //tmpArr.push(this.cloneArray(this.environment))
                //tmpArr.get(1).setNode(this.code.get(this.code.length() - 1).getNode())
                this.logger.info("loading function: " + tmpArr.get(0)  /*+ " in environment: " + tmpArr[1]*/)
                tmpArr.node = tmpArr.get(0).getNode()
                tmpArr.isClosure = true
                this._state.stack.push(tmpArr)
                break
            case InstructionShortcut.AP:
                tmpArr.push(this._state.stack.pop())
                tmpArr.push(this._state.stack.pop())
                tmpArr3 = tmpArr.get(0) as SECDArray
                this._state.dump.push(this.cloneArray(this._state.stack))//save stack to dump
                this._state.dump.push(this.cloneArray(this._state.code))//save code to dump
                this._state.dump.push(this.cloneArray(this._state.environment))//save environment to dump
                invalid = new SECDHidden()//Representing function before entering this new one
                //invalid.node = tmpArr3.node
                if(tmpArr3.node instanceof LambdaNode || tmpArr3.node instanceof DefineNode) {//If applying recursive function
                    invalid.node = tmpArr3.node.body()

                    invalid.callNode = currNode
                    invalid.callNode.removeReduction()
                }
                this._state.dump.push(invalid)
                this._state.code        = this.cloneArray(tmpArr3.get(0) as SECDArray)
                this._state.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
                this._state.environment = this.cloneArray(tmpArr3.get(1) as SECDArray)
                this._state.environment.push(tmpArr.get(1))
                this._state.stack.clear()
                this.logger.info("Applying function: " + this._state.code + " with arguments: " + this._state.environment + "")
                if(tmpArr3.node instanceof LambdaNode) {
                    tmpArr3.node.removeReduction()
                }
                this._state.code.removeReduction()//Fix node parent when entering new function
                //this.stack.removeReduction()
                //this.environment.removeReduction()
                break
            case InstructionShortcut.RAP:
                tmpArr.push(this._state.stack.pop())
                tmpArr.push(this._state.stack.pop())
                tmpArr.node = tmpArr.get(1).getNode()
                this._state.environment.arr[this._state.environment.length() - 1] = tmpArr.get(1)
                tmpArr.push(this._state.environment.pop())
                this._state.dump.push(this.cloneArray(this._state.stack))
                this._state.dump.push(this.cloneArray(this._state.code))
                this._state.dump.push(this.cloneArray(this._state.environment))
                this._state.environment.push(tmpArr.pop())
                indexesList = tmpArr.get(0) as SECDArray;
                invalid = new SECDHidden()
                invalid.node = indexesList.node.clone()
                this._state.dump.push(invalid)
                //(<SECDArray> tmpArr.get(tmpArr.length() - 1)).name = GeneralUtils.getFunctionName(tmpArr3.getNode())
                this._state.code        = this.cloneArray(indexesList.get(0) as SECDArray)
                this._state.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
                /*closure.node.removeReduction()
                this.code.removeReduction()//Fix node parent when entering new function
                this.stack.removeReduction()*/
                this._state.stack.clear()
                this.logger.info("Applying recursive function: " + this._state.code + " with arguments: " + this._state.environment + "")
                break
            case InstructionShortcut.RTN:
                let tmp = this._state.stack.pop()
                tmp = tmp.clone()
                tmpArr.push(tmp)
                invalid = this._state.dump.pop() as SECDHidden
                this._state.stack       = new SECDArray()
                this._state.environment = new SECDArray()
                this._state.code        = new SECDArray()
                this._state.environment = this._state.environment.concat(this._state.dump.pop() as SECDArray) as SECDArray
                this._state.code        = this._state.code.concat(this._state.dump.pop() as SECDArray) as SECDArray
                this._state.stack       = this._state.stack.concat(this._state.dump.pop() as SECDArray) as SECDArray

                if(invalid.node instanceof ReduceNode)
                    invalid.node.reduced().removeReduction()
                invalid.callNode.update(<InnerNode> tmpArr.get(0).getNode(), true);//update function node on place where it was called
                (invalid.callNode.parent as InnerNode)._returned = true
                this._state.stack.push(tmpArr.get(0))
                this.logger.info("Returning from function, result: " + tmpArr.get(0))
                break
            case InstructionShortcut.DEFUN:
                if(this._state.environment.get(0) instanceof SECDArray) {
                    this._state.stack.get(this._state.stack.length() - 1).node = node;
                    (<SECDArray> this._state.environment.get(0)).push(this._state.stack.pop())
                    //this.environment.get(0).node = node
                }
                else
                    throw new InterpreterError("Error in interpreter")
                break
            case InstructionShortcut.STOP:
                break
            default:
                throw new InterpreterError("Error in interpreter")
        }
        return null
    }
}
