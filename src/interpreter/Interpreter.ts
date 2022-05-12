import {SECDArray} from "../SECD/SECDArray"
import {Instruction} from "../SECD/instructions/Instruction";
import {Logger} from "../logger/Logger";
import {SECDValue} from "../SECD/SECDValue";
import {InstructionShortcut} from "../SECD/instructions/InstructionShortcut";
import {ColourType} from "../SECD/ColourType";
import {BinaryExprNode, CompositeNode, DefineNode, ReduceNode, ApplicationNode, IfNode, InnerNode, LambdaNode, LetNode,
    MainNode, NullNode, TopNode, ValueNode, VarNode, QuoteNode, UnaryExprNode, BindNode, StringNode} from "../AST/AST";
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
    private lastFuncApplicationNode: InnerNode
    private _gensymVars: Array<string>//stores already generated gensym strings

    constructor(instructions: SECDArray, topNode: TopNode, environment?: SECDArray) {
        this._state = new InterpreterState(instructions.reverse(), topNode, environment)
        this.logger = new Logger()
        this._lastInstruction = new Instruction(InstructionShortcut.DUMMY)
        this.lastInstructionNode = new NullNode()
        this.finished = false
        this.returned = false
        this.lastFuncApplicationNode = new NullNode()
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
                        throw new InterpreterError("The CAR instruction called on an empty array")
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
                    throw new InterpreterError("The CAR instruction called on an empty array")
                break;
            case InstructionShortcut.CDR:
                if(val instanceof SECDArray && val.node instanceof CompositeNode) {
                    if(val.length() == 0){
                        throw new InterpreterError("The CDR instruction called on an empty array")   
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
                   throw new InterpreterError("The CDR instruction called on an empty array")
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
        let element = new SECDValue(res)
        this._state.stack.push(element)
        node = new ValueNode(res)
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
        }
        else {
            this._state.code = branch2.clone() as SECDArray//It is always SECDArray
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
            this.lastInstructionNode = code.get(this._state.code.length() - 1).node
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
     * @param lastInstructionNode  - node of the instruction
     * @private
     */

    private applyInstruction(instructionShortcut: InstructionShortcut, lastInstructionNode: InnerNode): Interpreter | null{
        let currNode = this._state.code.get(this.state.code.length() - 1).node
        this._state.code.pop()
        let codeRegisterNode: InnerNode, loadedValueNode: InnerNode
        let varNode: VarNode
        let tmpArr = new SECDArray()
        let tmpArr2: SECDArray = new SECDArray(), argumentsOfFunction: SECDArray, indecedList: SECDArray, closure: SECDArray
        let hidden: SECDHidden
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut.LDC:
                this._state.stack.push(this._state.code.pop())
                break
            case InstructionShortcut.LD:
                varNode = <VarNode> this._state.code.get(this.state.code.length() - 1).node
                indecedList = this._state.code.pop() as SECDArray
                if(!(indecedList instanceof SECDArray))
                    throw new InterpreterError("LD is not followed by list of indexes")
                let index1 = indecedList.get(1)
                let index2 = indecedList.get(0)
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
                    loadedValueNode = loaded.node
                    if (loaded.node.isValue()) {
                        //Last element of array should always have node that is parent of nodes of pervious elements
                        if (this.returned)//If continuing evaluating a function after returning from this function
                            this.lastFuncApplicationNode.loadVariable(varNode.variable, loadedValueNode)
                        else {
                            (<InnerNode> this._state.code.get(0).node).loadVariable(varNode.variable, loadedValueNode)
                        }
                        if (loaded instanceof SECDValue) {
                            this.logger.info("loading value: " + loaded)
                            this._state.stack.push(new SECDValue(loaded.constant as unknown as string | number | Instruction, loadedValueNode))
                        } else {//Loading list
                            this.logger.info("loading array")
                            this._state.stack.push(loaded)
                        }
                    } else {//Loading fce
                        this.logger.info("loading fce")
                        codeRegisterNode = <InnerNode> indecedList.node;
                        if (codeRegisterNode.parent instanceof LetNode)
                            codeRegisterNode.loadVariable(varNode.variable, loadedValueNode)// If recursive function called for the first time
                        this._state.stack.push(loaded)
                    }
                }
                break
            case InstructionShortcut.SEL:
                this.evaluateSEL(this._state.stack.pop(), this._state.code.pop(), this._state.code.pop(), lastInstructionNode as IfNode)
                this.returned = false
                break
            case InstructionShortcut.JOIN:
                this._state.code = this._state.dump.pop() as SECDArray
                break
            case InstructionShortcut.NIL:
                this._state.stack.push(new SECDArray())
                break
            case InstructionShortcut.DUM:
                this._state.environment.push(new SECDArray())
                break
            case InstructionShortcut.POP:
                this._state.stack.pop()
                break
            case InstructionShortcut.CONSP:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
                this.evaluateUnaryOperator(this._state.stack.pop(), instructionShortcut, lastInstructionNode)
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
                this.evaluateBinaryOperator(this._state.stack.pop(), this._state.stack.pop(), instructionShortcut, lastInstructionNode)
                break
            case InstructionShortcut.CONS:
                let arg2 = this._state.stack.pop()
                let arg1 = this._state.stack.pop()
                let res
                if(arg1 instanceof SECDArray) {//If first element is already SECDArray push second element there
                    if (arg1.length() == 0) {
                        arg1.push(arg2)
                        //If the node is a binding (its parent is a BindNode), 
                        arg1.node = !(arg2.node.parent instanceof BindNode)  ? new CompositeNode(Array(arg2.node)) : new CompositeNode(Array(arg2.node.parent))
                    }
                    else {//If composide node
                        arg1.push(arg2);
                        if(arg2.node.parent instanceof BindNode){//If this is expression of a binding, add node of the binding
                            (arg1.node as CompositeNode).addItemBack(arg2.node.parent)
                        }
                        else {
                            (arg1.node as CompositeNode).addItemBack(arg2.node)
                        }
                    }
                    res = arg1
                }
                else if(arg1 instanceof SECDValue){
                    //If first element is SECDValue, create an SECDArray and push both arguments there
                    res = new SECDArray()
                    res.push(arg1)
                    if(arg2 instanceof SECDArray) {
                        //If second element is SECDArray, we essentialy create a chain of cons cells => list of first all elements
                        arg2.forEach(element => res.push(element))
                        res.node = arg2.node;
                        (res.node as CompositeNode).addItemFront(arg1.node)
                    }
                    else if(arg2 instanceof SECDValue){
                        //create whole new list, so create new SECD array
                        res.push(arg2)
                        res.node = new CompositeNode(Array(arg1.node, arg2.node))
                    }
                }
                else {
                    throw new InterpreterError("Called cons on unsupported type of SECDElement")
                }
                this._state.stack.push(res)
                break
            case InstructionShortcut.LDF:
                closure = new SECDArray()
                //create closure
                //environment will be first to render nicely on frontend
                closure.push(this._state.environment)
                closure.push(this._state.code.pop())
                this.logger.info("loading function: " + closure.get(1))
                closure.node = closure.get(1).node
                this._state.stack.push(closure)
                break
            case InstructionShortcut.AP:
                closure = this._state.stack.pop() as SECDArray
                argumentsOfFunction = this._state.stack.pop() as SECDArray
                this._state.dump.push(this._state.stack.clone())//save stack to dump
                this._state.dump.push(this._state.code.clone())//save code to dump
                this._state.dump.push(this._state.environment.clone())//save environment to dump
                hidden = new SECDHidden()//Representing function before entering this new one
                if(closure.node instanceof LambdaNode || closure.node instanceof DefineNode) {
                    //prepare for possibility of the function being recursive
                    hidden.node = closure.node.body()
                    hidden.callNode = currNode
                    hidden.callNode.removeReduction()//remove reduce nodes in the node of the application
                }
                this._state.dump.push(hidden)
                this._state.code        = closure.get(1).clone() as SECDArray// It is always SECDArray
                this._state.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
                this._state.environment = closure.get(0).clone() as SECDArray//It is always SECDArray
                this._state.environment.push(argumentsOfFunction)//Push arguments of the function to environment
                this._state.stack.clear()
                this.logger.info("Applying function: " + this._state.code + " with arguments: " + this._state.environment + "")
                if(closure.node instanceof LambdaNode) {
                    closure.node.removeReduction()//remove reduce nodes in the body of the function
                }
                this._state.code.removeReduction()//Fix parents of nodes when entering new function
                this.returned = false//New function will be evaluated from its beginning
                break
            case InstructionShortcut.RAP:
                closure = this._state.stack.pop() as SECDArray
                argumentsOfFunction = this._state.stack.pop() as SECDArray
                this._state.environment.arr[this._state.environment.length() - 1] = argumentsOfFunction
                this._state.dump.push(this._state.stack.clone())//save stack to dump
                this._state.dump.push(this._state.code.clone())//save code to dump
                this._state.dump.push(this._state.environment.clone())//save environment to dump
                this._state.environment.push(this._state.environment.pop())
                hidden = new SECDHidden()
                hidden.node = closure.node
                this._state.dump.push(hidden)
                this._state.code        = closure.get(1).clone() as SECDArray
                this._state.code.node = new NullNode()//We no longer need this node(It would cause unnessesary colouring)
                this._state.stack.clear()
                this.logger.info("Applying recursive function: " + this._state.code + " with arguments: " + this._state.environment + "")
                this.returned = false
                break
            case InstructionShortcut.RTN:
                //clone returned value
                let returnedVal = this._state.stack.pop().clone()
                hidden = this._state.dump.pop() as SECDHidden
                this._state.stack       = new SECDArray()
                this._state.environment = new SECDArray()
                this._state.code        = new SECDArray()
                //Pop registers backup from dump
                this._state.environment = this._state.environment.concat(this._state.dump.pop() as SECDArray) as SECDArray
                this._state.code        = this._state.code.concat(this._state.dump.pop() as SECDArray) as SECDArray
                this._state.stack       = this._state.stack.concat(this._state.dump.pop() as SECDArray) as SECDArray
                if(hidden.node) {
                    hidden.node.removeReduction()
                    //Set node of last function application in this funciton
                    if (hidden.callNode.parent instanceof ReduceNode)
                        this.lastFuncApplicationNode = hidden.callNode.parent.parent as InnerNode
                    else
                        this.lastFuncApplicationNode = hidden.callNode.parent as InnerNode
                    hidden.callNode.update(<InnerNode> returnedVal.node, true);//update function node on place where it was called
                }
                this._state.stack.push(returnedVal)
                this.logger.info("Returning from function, result: " + returnedVal)
                this.returned = true//Function stoped evaluating somewhere in the middle
                break
            case InstructionShortcut.DEFUN:
                if(this._state.environment.get(0) instanceof SECDArray) {
                    this._state.stack.get(this._state.stack.length() - 1).node = lastInstructionNode;
                    (<SECDArray> this._state.environment.get(0)).push(this._state.stack.pop())
                }
                else
                    throw new InterpreterError("List for global functions is not a list")//This hopefully should not even happen
                break
            case InstructionShortcut.STOP:
                break
            default:
                throw new InterpreterError("Unexpected instrution")
        }
        return null
    }
}
