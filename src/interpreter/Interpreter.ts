import {SECDArray} from "../utility/SECD/SECDArray"
import {Instruction} from "../utility/instructions/Instruction";
import {Logger} from "../logger/Logger";
import {SECDValue} from "../utility/SECD/SECDValue";
import {InstructionShortcut} from "../utility/instructions/InstructionShortcut";
import {ColourType} from "../utility/SECD/ColourType";
import {InnerNode, TopNode, ValueNode, VarNode, Node, DefineNode, MainNode} from "../AST/AST";
import {SECDElement} from "../utility/SECD/SECDElement";
import {SECDElementType} from "../utility/SECD/SECDElementType";


export class Interpreter{
    logger: Logger
    lastInstruction: SECDValue | null
    private readonly _topNode: TopNode

    constructor(instructions: SECDArray) {
        this._code = instructions
        this._stack = new SECDArray()
        this._dump = new SECDArray()
        this._environment = new SECDArray()
        this.environment.push(new SECDArray())
        this.logger = new Logger()
        this.lastInstruction = null
        this._topNode = <TopNode>instructions.node
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
        arr.forEach(val => other.push(val))
        other.node = arr.node
        return other
    }

    private evaluateUnaryExpression(arr: SECDElement, instructionShortcut: InstructionShortcut) {
        this.logger.info("evaluating unary expression on target: " + arr)
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.CONSP:
                this.push(this.stack, arr instanceof SECDArray)
                break;
            case InstructionShortcut.CAR:
                if(arr instanceof SECDArray)
                    this.stack.push(arr.shift())
                //else Runtime Error
                break;
            case InstructionShortcut.CDR:
                if(arr instanceof SECDArray)
                    arr.shift()
                //else Runtime Error
                this.stack.push(arr)
                break;
        }
    }

    private static boolToInt(bool: boolean){
        if(bool)
            return 1
        return 0
    }

    private evaluateBinaryExpression(val1: SECDElement, val2: SECDElement, instruction: SECDValue) {
        let num1 = (<SECDValue> val1).val
        let num2 = (<SECDValue> val2).val
        if(typeof num1 != "number" || typeof num2 != "number")
            return//Runtime Error
        this.logger.info("evaluating binary expression on targets: " + num1 + " and " + num2)
        let instructionShortcut = instruction.val as unknown as InstructionShortcut
        let node;
        let res = 0
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.ADD:
                res = num1 + num2
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.SUB:
                res = num1 - num2
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.MUL:
                res = num1 * num2
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.DIV:
                res = num1 / num2
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.EQ:
                res = Interpreter.boolToInt(num1 == num2)
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.NE:
                res = Interpreter.boolToInt(num1 != num2)
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.LT:
                res = Interpreter.boolToInt(num1 < num2)
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.LE:
                res = Interpreter.boolToInt(num1 <= num2)
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.HT:
                res = Interpreter.boolToInt(num1 > num2)
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
            case InstructionShortcut.HE:
                res = Interpreter.boolToInt(num1 >= num2)
                this.push(this.stack, res)
                node = new ValueNode(res)
                instruction.setNode(node)
                this.stack.get(this.stack.length() - 1).setNode(node)
                break
        }
    }

    private evaluateIf(expr: SECDElement, branch1: SECDElement, branch2: SECDElement, val: SECDValue){
        if(!(branch1 instanceof SECDArray) || !(branch2 instanceof SECDArray) || !(expr instanceof SECDValue))
            return //Runtime Error
        this.logger.info("evaluating if with condition " + expr + " with branches: " + branch1 + " and " + branch2)
        this.dump.push(this.cloneArray(this.code))
        if(expr.val)
            this._code = this.cloneArray(branch1)
        else
            this._code = this.cloneArray(branch2)
        val.setNode(<InnerNode> this._code.getNode())
    }

    private evaluateLoad(num1: number, num2: number): SECDElement{
        let x = this.environment.length() - num1 - 1
        let innerArr = this.environment.get(x)
        if(innerArr instanceof SECDArray) {
            let loaded = innerArr.get(innerArr.length() - num2 - 1)
            //if (loaded instanceof SECDArray)
                return loaded
            /*else {
                let arr = new SECDArray()
                arr.push(loaded)
                return arr
            }*/

        }
        return new SECDValue(0)//TODO tmp to compile, throw error in future
        //Runtime Error
    }

    public detectAction(){
        if(this.lastInstruction != null)
            this.applyInstruction(this.lastInstruction)
        let code: SECDArray = this.code
        if(code.length() == 0) {
            this.lastInstruction = null
            this._topNode.node.clean()
            return
        }
        try {
            this.lastInstruction = code.get(0) as SECDValue
            this.colourArray(this.lastInstruction.val as unknown as InstructionShortcut)
        }
        catch (exception){

        }
    }
    
    private colourArray(instructionShortcut: InstructionShortcut){
        let element: SECDElement
        this._topNode.node.clean();
        this.code.clean();
        this.stack.clean();
        this.dump.clean();
        this.environment.clean();
        this.code.get(0).colour = ColourType.Current
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.LDC:
                element = this.code.get(1);
                element.getNode().setColour(ColourType.Coloured)
                if(element.type == SECDElementType.Value)
                    element.colour = ColourType.Coloured
                //else Error
                break
            case InstructionShortcut.LD:
                this.code.get(1).getNode().setColour(ColourType.Coloured)
                element = this.code.get(1);
                let loaded: SECDElement
                if(element instanceof SECDArray) {
                    element.colour = ColourType.Coloured
                    loaded = this.evaluateLoad((<SECDValue>(element).get(0)).val as unknown as number,
                        (<SECDValue>(element).get(1)).val as unknown as number)
                    loaded.colour = ColourType.Coloured;
                    loaded.getNode().setColour(ColourType.Coloured)
                }
                //TODO Error
                break
            case InstructionShortcut.SEL:
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured;
                this.code.get(1).colour = ColourType.SecondColoured;
                this.code.get(2).colour = ColourType.ThirdColoured;
                this.code.get(0).getNode().setColour(ColourType.Current)
                break
            case InstructionShortcut.JOIN:
                this.dump.get(this.dump.length() - 1).colour = ColourType.Coloured;
                this.code.get(0).getNode().setColour(ColourType.Coloured)
                break
            case InstructionShortcut.NIL:
                break
            case InstructionShortcut.DUM:
                break
            case InstructionShortcut.CONSP:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
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
                this.code.get(0).colour = ColourType.Current
                this.code.get(0).getNode().setColour(ColourType.Current)
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured
                this.stack.get(this.stack.length() - 2).colour = ColourType.SecondColoured
                break
            case InstructionShortcut.CONS:
                this.code.get(0).colour = ColourType.Current
                this.code.get(0).getNode().setColour(ColourType.Current)
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured
                this.stack.get(this.stack.length() - 2).colour = ColourType.SecondColoured;
                break
            case InstructionShortcut.LDF:
                this.code.get(1).colour = ColourType.Coloured;
                this.code.get(1).getNode().setColour(ColourType.Coloured)
                break
            case InstructionShortcut.AP:
                element = (<SECDArray> this.stack.get(this.stack.length() - 1)).get(0)
                element.colour = ColourType.Current
                element.getNode().setColour(ColourType.Current);
                (<SECDArray> this.stack.get(this.stack.length() - 2)).get(0).colour = ColourType.Coloured;
                (<SECDArray> this.stack.get(this.stack.length() - 2)).get(1).colour = ColourType.Coloured;
                (<SECDArray> this.stack.get(0)).get(0).getNode().setColour(ColourType.Coloured);
                (<SECDArray> this.stack.get(0)).get(1).getNode().setColour(ColourType.Coloured)
                break
            case InstructionShortcut.RAP:
                this.stack.get(this.stack.length() - 1).colour = ColourType.Coloured
                this.stack.get(this.stack.length() - 2).colour = ColourType.Coloured
                break
            case InstructionShortcut.RTN:
                this.stack.get(this.stack.length() - 1).colour = ColourType.Current;
                this.code.get(this.code.length() - 1).getNode().setColour(ColourType.Current)
                this.dump.get(this.dump.length() - 1).colour = ColourType.ThirdColoured
                this.dump.get(this.dump.length() - 2).colour = ColourType.SecondColoured
                this.dump.get(this.dump.length() - 3).colour = ColourType.Coloured
                break
            case InstructionShortcut.DEFUN:
                this.environment.get(0).colour = ColourType.Coloured
                break
            default:
                console.log("error")
        }
    }

    private applyInstruction(val: SECDValue){
        let instructionShortcut = val.val as unknown as InstructionShortcut
        this.code.shift()
        let node2: InnerNode
        let node: VarNode
        let tmpArr = new SECDArray()
        let tmpArr2: SECDArray = new SECDArray(), tmpArr3
        //@ts-ignore
        switch (InstructionShortcut[instructionShortcut] as InstructionShortcut) {
            case InstructionShortcut.LDC:
                tmpArr.push(this.code.shift())
                this.stack.push(tmpArr.get(0))
                break
            case InstructionShortcut.LD:
                node = <VarNode> this.code.get(0).getNode()
                tmpArr.push(this.code.shift())
                tmpArr3 = tmpArr.get(0) as SECDArray
                let loaded = this.evaluateLoad((<SECDValue>tmpArr3.get(0)).val as unknown as number, (<SECDValue> tmpArr3.get(1)).val as unknown as number)
                if(loaded instanceof SECDValue)
                    this.logger.info("loading value: " + loaded)
                else
                    this.logger.info("loading array")
                if (typeof loaded != "undefined") {
                    node2 = <InnerNode> this.code.getNode();
                    if(node2 instanceof TopNode || node2 instanceof MainNode || node2 instanceof DefineNode)
                        node2.loadVariable(node.variable, <InnerNode>loaded.getNode())
                    else
                        (<InnerNode> node2._parent).loadVariable(node.variable, <InnerNode>loaded.getNode())
                    if (loaded instanceof SECDArray)
                        this.stack.push(loaded)
                    else if (loaded instanceof SECDValue)
                        this.stack.push(new SECDValue(loaded.val as unknown as number | string, <InnerNode> loaded.node))
                }
                //else Runtime Error
                break
            case InstructionShortcut.SEL:
                this.evaluateIf(this.stack.pop(), this.code.shift(), this.code.shift(), val)
                break
            case InstructionShortcut.JOIN:
                this._code = this.dump.pop() as SECDArray
                break
            case InstructionShortcut.NIL:
                //this.logger.info("loading empty list")
                this.stack.push(new SECDArray())
                break
            case InstructionShortcut.DUM:
                this.environment.push(new SECDArray())
                break
            case InstructionShortcut.CONSP:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
                this.evaluateUnaryExpression(this.stack.pop(), instructionShortcut)
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
            case InstructionShortcut.CONS:
                tmpArr.push(this.stack.pop())
                tmpArr2 = this.stack.pop() as SECDArray
                tmpArr2.push(tmpArr.pop())
                this.stack.push(tmpArr2)
                break
            case InstructionShortcut.LDF:
                tmpArr.push(this.code.shift())
                tmpArr.push(this.environment)
                this.logger.info("loading function: " + tmpArr.get(0)  /*+ " in environment: " + tmpArr[1]*/)
                this.stack.push(tmpArr)
                break
            case InstructionShortcut.AP:
                tmpArr.push(this.stack.pop())
                tmpArr.push(this.stack.pop())
                this.dump.push(this.cloneArray(this.stack))
                this.dump.push(this.cloneArray(this.code))
                this.dump.push(this.cloneArray(this.environment))
                tmpArr3 = tmpArr.get(0) as SECDArray
                this.code        = this.cloneArray(tmpArr3.get(0) as SECDArray)
                this.environment = this.cloneArray(tmpArr3.get(1) as SECDArray)
                this.environment.push(tmpArr.get(1))
                this.stack.clear()
                this.logger.info("Applying function: " + this.code + " with arguments: " + this.environment + "")
                break
            case InstructionShortcut.RAP:
                tmpArr.push(this.stack.pop())
                tmpArr.push(this.stack.pop())
                this._environment.arr[this.environment.length() - 1] = tmpArr.get(1)
                tmpArr.push(this.environment.pop())
                this.dump.push(this.cloneArray(this.stack))
                this.dump.push(this.cloneArray(this.code))
                this.dump.push(this.cloneArray(this.environment))
                this.environment.push(tmpArr.pop())
                tmpArr3 = tmpArr.get(0) as SECDArray
                this.code        = tmpArr3.get(0) as SECDArray
                this.stack.clear()
                this.logger.info("Applying recursive function: " + this.code + " with arguments: " + this.environment + "")
                break
            case InstructionShortcut.RTN:
                tmpArr.push(this.stack.pop());
                if(this.lastInstruction)
                    this.lastInstruction.getNode().update(<InnerNode> tmpArr.get(0).getNode())
                this.stack       = new SECDArray()
                this.environment = new SECDArray()
                this.code        = new SECDArray()
                this.environment = this.environment.concat(this.dump.pop() as SECDArray) as SECDArray
                this.code        = this.code.concat(this.dump.pop() as SECDArray) as SECDArray
                this.stack       = this.stack.concat(this.dump.pop() as SECDArray) as SECDArray
                this.stack.push(tmpArr.get(0))
                this.logger.info("Returning from function, result: " + tmpArr.get(0))
                break
            case InstructionShortcut.DEFUN:
                if(this.environment.get(0) instanceof SECDArray) {
                    this.stack.get(this.stack.length() - 1).node = (<DefineNode> val.getNode()).body;
                    (<SECDArray>this.environment.arr[0]).push(this.stack.pop())
                }//else Runtime Error
                break
            default:
                console.log("error")
        }
    }
}