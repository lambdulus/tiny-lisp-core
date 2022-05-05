import {SECDArray} from "../SECD/SECDArray"
import {Instruction} from "../SECD/instructions/Instruction";
import {Logger} from "../logger/Logger";
import {SECDValue} from "../SECD/SECDValue";
import {InstructionShortcut} from "../SECD/instructions/InstructionShortcut";
import {ColourType} from "../SECD/ColourType";
import {BinaryExprNode, CompositeNode, DefineNode, ReduceNode, ApplicationNode, IfNode, InnerNode, LambdaNode, LetNode,
    ListNode, MainNode, NullNode, TopNode, ValueNode, VarNode, QuoteNode, UnaryExprNode, BindNode, StringNode} from "../AST/AST";
import {SECDElement} from "../SECD/SECDElement";
import {SECDElementType} from "../SECD/SECDElementType";
import { InterpreterError } from "./InterpreterErrors";
import { GeneralUtils, InterpreterUtils, Parser } from "..";
import { SECDHidden } from "../SECD/SECDHidden";
import { InterpreterState } from "./InterpreterState";


export class Interpreter{
    get gensymVars(): Array<string> {
        return this._gensymVars;
    }
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
    private returned: boolean
    private _state: InterpreterState
    private currNode: InnerNode
    private _gensymVars: Array<string>

    constructor(instructions: SECDArray, topNode: TopNode, environment?: SECDArray) {
        this._state = new InterpreterState(instructions.reverse(), topNode, environment)
        this.logger = new Logger()
        this._lastInstruction = new Instruction(InstructionShortcut.DUMMY)
        this.lastInstructionNode = new NullNode()
        this.finished = false
        this.returned = false
        this.currNode = new NullNode()
        this._gensymVars = Array("gensym")
    }

    

    /**
     * Converts boolean value to number
     * @param bool
     * @private
     */

    private static boolToInt(bool: boolean){
        return bool ? 1 : 0
    }

    /**
     * Evaluates unary operator
     * @param val                   - argument of the operator
     * @param instructionShortcut   - shortcut of the operator
     * @param instructionNode       - node of the unary expression
     * @private
     */

    private evaluateUnaryOperator(val: SECDElement, instructionShortcut: InstructionShortcut, instructionNode: InnerNode) {
        this.logger.info("evaluating unary expression on target: " + val)
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut.CONSP:
                let value = val instanceof SECDArray ? 1 : 0
                let node = new ValueNode(value)
                let element = new SECDValue(value, node)
                instructionNode.update(node, false)//update instruction node
                this._state.stack.push(element)
                break;
            case InstructionShortcut.CAR:
                if(val instanceof SECDArray && val.node instanceof CompositeNode) {
                    if(val.length() == 0){
                        throw new InterpreterError("CAR called on empty array")
                    }
                    let newVal = val.clone() as SECDArray
                    let node = (newVal.node as CompositeNode).items()[0]
                    let element = newVal.shift()
                    element.node = node
                    this._state.stack.push(element)
                    newVal.node.update(node, false)
                    val = newVal
                }
                else
                    throw new InterpreterError("Error in interpreter")
                break;
            case InstructionShortcut.CDR:
                if(val instanceof SECDArray && val.node instanceof CompositeNode) {
                    if(val.length() == 0){
                        throw new InterpreterError("CDR called on empty array")   
                    }
                    let newVal = val.clone() as SECDArray
                    newVal.shift()
                    let node = newVal.node.clone();
                    (node as CompositeNode).popFront()
                    newVal.node.update(node, false)
                    newVal.node = node
                    val = newVal
                }
                else
                   throw new InterpreterError("Error in interpreter")
                this._state.stack.push(val)
                break;
        }
    }

    /**
     * Evaluates binary operator
     * @param val1                  - first argument of operator
     * @param val2                  - secod argument of operator
     * @param instructionShortcut   - shortcut of the instruction
     * @param instructionNode       - node of the binary instruction
     * @private
     */

    private evaluateBinaryOperator(val1: SECDElement, val2: SECDElement, instructionShortcut: InstructionShortcut, instructionNode: InnerNode) {
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

    /**
     * Evaluate SEL instruction
     * @param condElement - condition
     * @param branch1     - first branch of if
     * @param branch2     - second branch of if
     * @param ifNode      - node of if
     * @private
     */

    private evaluateSEL(condElement: SECDElement, branch1: SECDElement, branch2: SECDElement, ifNode: IfNode){
        if(!(branch1 instanceof SECDArray) || !(branch2 instanceof SECDArray) || !(condElement instanceof SECDValue))
            throw new InterpreterError("Error in interpreter")
        this.logger.info("evaluating if with condition " + condElement + " with branches: " + branch1 + " and " + branch2)
        this._state.dump.push(this._state.code.clone())
        let cond = condElement.constant
        if(typeof (cond) != "number")
            throw new InterpreterError("Element on top of the stack is not a number")
        if(cond as number) {
            this._state.code = branch1.clone() as SECDArray//It is always SECDArray
            ifNode.chosenBranch = 1
        }
        else {
            this._state.code = branch2.clone() as SECDArray//It is always SECDArray
            ifNode.chosenBranch = 2
        }
        this._state.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
    }

    /**
     * Performs interpreter step
     */

    public step(): void{
        if((this._lastInstruction).shortcut !== InstructionShortcut.DUMMY) {
            this.applyInstruction(this._lastInstruction.shortcut, this.lastInstructionNode)
        }
        let code: SECDArray = this._state.code
        if(code.length() == 0) {
            console.log("Result: ", this._state.stack.get(this._state.stack.length() - 1))
            this.finished = true
            this.lastInstruction.shortcut = InstructionShortcut.DUMMY
            return
        }
        try {
            let lastConstant = (code.get(this._state.code.length() - 1) as SECDValue).constant
            if(!(lastConstant instanceof Instruction))
                throw new InterpreterError("Element on top of code register is not instruction")
            this._lastInstruction = lastConstant
            this.lastInstructionNode = code.get(this._state.code.length() - 1).getNode()
        }
        catch (exception){

        }
    }

    /**
     * Runs interpreter until code register is empty
     */

    public run(){
        let x = 0
        while(!this.finished) {
            this.step()
            x ++
        }
        console.log("Steps: ", x)
    }

    
    
    /**
     * 
     * @param instructionShortcut - instruction to be executed
     * @param node  - node of the instruction
     * @private
     */

    private applyInstruction(instructionShortcut: InstructionShortcut, node: InnerNode): Interpreter | null{
        let currNode = this._state.code.get(this.state.code.length() - 1).getNode()
        this._state.code.pop()
        let node2: InnerNode, newNode: InnerNode
        let varNode: VarNode
        let tmpArr = new SECDArray()
        let tmpArr2: SECDArray = new SECDArray(), indexesList, tmpArr3: SECDArray
        let hidden: SECDHidden
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut.LDC:
                tmpArr.push(this._state.code.pop())
                this._state.stack.push(tmpArr.get(0))
                break
            case InstructionShortcut.LD:
                varNode = <VarNode> this._state.code.get(this.state.code.length() - 1).getNode()
                tmpArr.push(this._state.code.pop())
                indexesList = tmpArr.get(0)
                if(!(indexesList instanceof SECDArray))
                    throw new InterpreterError("LD is not followed by list of indexes")
                let index1 = indexesList.get(1)
                let index2 = indexesList.get(0)
                if(!(index1 instanceof SECDValue && index2 instanceof SECDValue))
                    throw new InterpreterError("LD indexes must be values")
                let val1 = index1.constant as unknown as number
                let val2 = index2.constant as unknown as number
                if((typeof (val1) != "number") && (typeof (val2) != "number"))
                    throw new InterpreterError("LD indexes are not numbers")
                if(val1 == -10 && val2 == -10){//If loading gensym
                    let variable = InterpreterUtils.gensym(this)
                    this._state.stack.push(new SECDValue(variable, new StringNode(variable)))
                }
                else {
                    let loaded = InterpreterUtils.evaluateLoad(this._state.environment, val1, val2)
                    if (loaded.getNode().isValue()) {
                        //Last element of array should always have node that is parent of nodes of pervious elements
                        node2 = <InnerNode>this._state.code.get(0).getNode();
                        newNode = loaded.getNode()
                        if (this.returned)
                            this.currNode.loadVariable(varNode.variable, newNode)
                        else
                            node2.loadVariable(varNode.variable, newNode)
                        if (loaded instanceof SECDValue) {
                            this.logger.info("loading value: " + loaded)
                            this._state.stack.push(new SECDValue(loaded.constant as unknown as string | number | Instruction, newNode))
                        } else {//Loading list
                            this.logger.info("loading array")
                            this._state.stack.push(loaded)
                        }
                    } else {
                        this.logger.info("loading array")
                        node2 = <InnerNode>tmpArr.get(0).getNode();
                        newNode = loaded.getNode()//.deapCopy()
                        if (node2.parent instanceof LetNode)
                            node2.loadVariable(varNode.variable, newNode)// If recursive function called for the first time
                        this._state.stack.push(loaded)
                    }
                }
                break
            case InstructionShortcut.SEL:
                this.evaluateSEL(this._state.stack.pop(), this._state.code.pop(), this._state.code.pop(), node as IfNode)
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
                this.evaluateUnaryOperator(this._state.stack.pop(), instructionShortcut, node)
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
                this.evaluateBinaryOperator(this._state.stack.pop(), this._state.stack.pop(), instructionShortcut, node)
                break
            case InstructionShortcut.CONS:
                let arg2 = this._state.stack.pop()
                let arg1 = this._state.stack.pop()
                let res
                if(arg1 instanceof SECDArray) {//If first element is already SECDArray push second element there
                    if (arg1.length() == 0) {
                        arg1.push(arg2)
                        arg1.node = arg2.node.isValue() ? new CompositeNode(Array(arg2.node))  : arg2.node
                    } else {//If composide node
                        arg1.push(arg2);
                        (arg1.node as CompositeNode).addItemBack(arg2.node)
                    }
                    res = arg1
                }
                else if(arg1 instanceof SECDValue){//If first element is SECDValue, create ne SECDArray and push both arguments there
                    res = new SECDArray()
                    res.push(arg1)
                    if(arg2 instanceof SECDArray) {
                        arg2.forEach(element => res.push(element))
                        res.node = arg2.node;
                        (res.node as CompositeNode).addItemFront(arg1.node)
                    }
                    else if(arg2 instanceof SECDValue){
                        res.push(arg2)
                    }
                }
                else {
                    throw new InterpreterError("Called cons on unsupported type of SECDElement")
                }
                this._state.stack.push(res)
                break
            case InstructionShortcut.LDF:
                tmpArr.push(this._state.environment)
                tmpArr.push(this._state.code.pop())
                this.logger.info("loading function: " + tmpArr.get(1)  /*+ " in environment: " + tmpArr[1]*/)
                tmpArr.node = tmpArr.get(1).getNode()
                tmpArr.isClosure = true
                this._state.stack.push(tmpArr)
                break
            case InstructionShortcut.AP:
                tmpArr.push(this._state.stack.pop())
                tmpArr.push(this._state.stack.pop())
                tmpArr3 = tmpArr.get(0) as SECDArray
                this._state.dump.push(this._state.stack.clone())//save stack to dump
                this._state.dump.push(this._state.code.clone())//save code to dump
                this._state.dump.push(this._state.environment.clone())//save environment to dump
                hidden = new SECDHidden()//Representing function before entering this new one
                //invalid.node = tmpArr3.node
                if(tmpArr3.node instanceof LambdaNode || tmpArr3.node instanceof DefineNode) {//If applying recursive function
                    hidden.node = tmpArr3.node.body()

                    hidden.callNode = currNode
                    hidden.callNode.removeReduction()
                }
                this._state.dump.push(hidden)
                this._state.code        = tmpArr3.get(1).clone() as SECDArray// It is always SECDArray
                this._state.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
                this._state.environment = tmpArr3.get(0).clone() as SECDArray//It is always SECDArray
                this._state.environment.push(tmpArr.get(1))
                this._state.stack.clear()
                this.logger.info("Applying function: " + this._state.code + " with arguments: " + this._state.environment + "")
                if(tmpArr3.node instanceof LambdaNode) {
                    tmpArr3.node.removeReduction()
                }
                this._state.code.removeReduction()//Fix node parent when entering new function
                this.returned = false//New function will be evaluated from its beginning
                break
            case InstructionShortcut.RAP:
                tmpArr.push(this._state.stack.pop())
                tmpArr.push(this._state.stack.pop())
                tmpArr.node = tmpArr.get(1).getNode()
                this._state.environment.arr[this._state.environment.length() - 1] = tmpArr.get(1)
                tmpArr.push(this._state.environment.pop())
                this._state.dump.push(this._state.stack.clone())
                this._state.dump.push(this._state.code.clone())
                this._state.dump.push(this._state.environment.clone())
                this._state.environment.push(tmpArr.pop())
                indexesList = tmpArr.get(0) as SECDArray;
                hidden = new SECDHidden()
                hidden.node = indexesList.node
                this._state.dump.push(hidden)
                //(<SECDArray> tmpArr.get(tmpArr.length() - 1)).name = GeneralUtils.getFunctionName(tmpArr3.getNode())
                this._state.code        = indexesList.get(1).clone() as SECDArray
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
                hidden = this._state.dump.pop() as SECDHidden
                this._state.stack       = new SECDArray()
                this._state.environment = new SECDArray()
                this._state.code        = new SECDArray()
                this._state.environment = this._state.environment.concat(this._state.dump.pop() as SECDArray) as SECDArray
                this._state.code        = this._state.code.concat(this._state.dump.pop() as SECDArray) as SECDArray
                this._state.stack       = this._state.stack.concat(this._state.dump.pop() as SECDArray) as SECDArray

                if(hidden.node) {
                    hidden.node.removeReduction()
                    if (hidden.callNode.parent instanceof ReduceNode)
                        this.currNode = hidden.callNode.parent.parent as InnerNode
                    else
                        this.currNode = hidden.callNode.parent as InnerNode
                    hidden.callNode.update(<InnerNode>tmpArr.get(0).getNode(), true);//update function node on place where it was called
                    (hidden.callNode.parent as InnerNode)._returned = true
                }
                this._state.stack.push(tmpArr.get(0))
                this.logger.info("Returning from function, result: " + tmpArr.get(0))
                this.returned = true//Function stoped evaluating somewhere in the middle
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
