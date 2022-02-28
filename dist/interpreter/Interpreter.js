"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const SECDArray_1 = require("../utility/SECD/SECDArray");
const Logger_1 = require("../logger/Logger");
const SECDValue_1 = require("../utility/SECD/SECDValue");
const InstructionShortcut_1 = require("../utility/instructions/InstructionShortcut");
const ColourType_1 = require("../utility/SECD/ColourType");
const AST_1 = require("../AST/AST");
const SECDElementType_1 = require("../utility/SECD/SECDElementType");
const InterpreterErrors_1 = require("./InterpreterErrors");
class Interpreter {
    constructor(instructions, topNode) {
        this._code = instructions;
        this._stack = new SECDArray_1.SECDArray();
        this._dump = new SECDArray_1.SECDArray();
        this._environment = new SECDArray_1.SECDArray();
        //this._environment.setNode(new VarNode("environment"))
        this.environment.push(new SECDArray_1.SECDArray());
        this.logger = new Logger_1.Logger();
        this.lastInstruction = null;
        this._topNode = topNode;
    }
    get topNode() {
        return this._topNode;
    }
    get stack() {
        return this._stack;
    }
    set stack(value) {
        this._stack = value;
    }
    get code() {
        return this._code;
    }
    set code(value) {
        this._code = value;
    }
    get dump() {
        return this._dump;
    }
    set dump(value) {
        this._dump = value;
    }
    get environment() {
        return this._environment;
    }
    set environment(value) {
        this._environment = value;
    }
    push(arr, val, node) {
        if (val == null)
            return -2;
        if (val instanceof SECDArray_1.SECDArray)
            arr.push(val);
        return arr.push(new SECDValue_1.SECDValue(val, node));
    }
    cloneArray(arr) {
        let other = new SECDArray_1.SECDArray();
        arr.forEach(val => other.push(val));
        other.node = arr.node;
        return other;
    }
    evaluateUnaryExpression(arr, instructionShortcut) {
        this.logger.info("evaluating unary expression on target: " + arr);
        //@ts-ignore
        switch (InstructionShortcut_1.InstructionShortcut[instructionShortcut]) {
            case InstructionShortcut_1.InstructionShortcut.CONSP:
                this.push(this.stack, arr instanceof SECDArray_1.SECDArray);
                break;
            case InstructionShortcut_1.InstructionShortcut.CAR:
                if (arr instanceof SECDArray_1.SECDArray)
                    this.stack.push(arr.shift());
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.CDR:
                if (arr instanceof SECDArray_1.SECDArray)
                    arr.shift(); //TODO look at this else later
                //else
                //    throw new InterpreterError("Error in interpreter")
                this.stack.push(arr);
                break;
        }
    }
    static boolToInt(bool) {
        if (bool)
            return 1;
        return 0;
    }
    evaluateBinaryExpression(val1, val2, instruction) {
        let num1 = val1.val;
        let num2 = val2.val;
        if (typeof num1 != "number" || typeof num2 != "number")
            throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        this.logger.info("evaluating binary expression on targets: " + num1 + " and " + num2);
        let instructionShortcut = instruction.val;
        let node;
        let res = 0;
        //@ts-ignore
        switch (InstructionShortcut_1.InstructionShortcut[instructionShortcut]) {
            case InstructionShortcut_1.InstructionShortcut.ADD:
                res = num1 + num2;
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.SUB:
                res = num1 - num2;
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.MUL:
                res = num1 * num2;
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.DIV:
                res = num1 / num2;
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.EQ:
                res = Interpreter.boolToInt(num1 == num2);
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.NE:
                res = Interpreter.boolToInt(num1 != num2);
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.LT:
                res = Interpreter.boolToInt(num1 < num2);
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.LE:
                res = Interpreter.boolToInt(num1 <= num2);
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.HT:
                res = Interpreter.boolToInt(num1 > num2);
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
            case InstructionShortcut_1.InstructionShortcut.HE:
                res = Interpreter.boolToInt(num1 >= num2);
                this.push(this.stack, res);
                node = new AST_1.ValueNode(res);
                instruction.setNode(node);
                this.stack.get(this.stack.length() - 1).setNode(node);
                break;
        }
    }
    evaluateIf(expr, branch1, branch2, val) {
        if (!(branch1 instanceof SECDArray_1.SECDArray) || !(branch2 instanceof SECDArray_1.SECDArray) || !(expr instanceof SECDValue_1.SECDValue))
            throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        this.logger.info("evaluating if with condition " + expr + " with branches: " + branch1 + " and " + branch2);
        this.dump.push(this.cloneArray(this.code));
        if (expr.val)
            this._code = this.cloneArray(branch1);
        else
            this._code = this.cloneArray(branch2);
        val.setNode(this._code.getNode());
    }
    evaluateLoad(num1, num2) {
        let x = this.environment.length() - num1 - 1;
        let innerArr = this.environment.get(x);
        if (innerArr instanceof SECDArray_1.SECDArray) {
            let loaded = innerArr.get(innerArr.length() - num2 - 1);
            //if (loaded instanceof SECDArray)
            return loaded;
            /*else {
                let arr = new SECDArray()
                arr.push(loaded)
                return arr
            }*/
        }
        throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
    }
    detectAction() {
        if (this.lastInstruction != null)
            this.applyInstruction(this.lastInstruction);
        let code = this.code;
        if (code.length() == 0) {
            this.lastInstruction = null;
            this._topNode.node.clean();
            return;
        }
        try {
            this.lastInstruction = code.get(0);
            this.colourArray(this.lastInstruction.val);
        }
        catch (exception) {
        }
    }
    colourArray(instructionShortcut) {
        let element;
        this._topNode.node.clean();
        this.code.clean();
        this.stack.clean();
        this.dump.clean();
        this.environment.clean();
        this.code.get(0).colour = ColourType_1.ColourType.Current;
        //@ts-ignore
        switch (InstructionShortcut_1.InstructionShortcut[instructionShortcut]) {
            case InstructionShortcut_1.InstructionShortcut.LDC:
                element = this.code.get(1);
                element.getNode().setColour(ColourType_1.ColourType.Coloured);
                if (element.type == SECDElementType_1.SECDElementType.Value)
                    element.colour = ColourType_1.ColourType.Coloured;
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.LD:
                this.code.get(1).getNode().setColour(ColourType_1.ColourType.Coloured);
                element = this.code.get(1);
                let loaded;
                if (element instanceof SECDArray_1.SECDArray) {
                    element.colour = ColourType_1.ColourType.Coloured;
                    loaded = this.evaluateLoad((element).get(0).val, (element).get(1).val);
                    loaded.colour = ColourType_1.ColourType.Coloured;
                    loaded.getNode().setColour(ColourType_1.ColourType.Coloured);
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.SEL:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                this.code.get(1).colour = ColourType_1.ColourType.SecondColoured;
                this.code.get(2).colour = ColourType_1.ColourType.ThirdColoured;
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Current);
                break;
            case InstructionShortcut_1.InstructionShortcut.JOIN:
                this.dump.get(this.dump.length() - 1).colour = ColourType_1.ColourType.Coloured;
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Coloured);
                break;
            case InstructionShortcut_1.InstructionShortcut.NIL:
                break;
            case InstructionShortcut_1.InstructionShortcut.DUM:
                break;
            case InstructionShortcut_1.InstructionShortcut.CONSP:
            case InstructionShortcut_1.InstructionShortcut.CAR:
            case InstructionShortcut_1.InstructionShortcut.CDR:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                break;
            case InstructionShortcut_1.InstructionShortcut.ADD:
            case InstructionShortcut_1.InstructionShortcut.SUB:
            case InstructionShortcut_1.InstructionShortcut.MUL:
            case InstructionShortcut_1.InstructionShortcut.DIV:
            case InstructionShortcut_1.InstructionShortcut.EQ:
            case InstructionShortcut_1.InstructionShortcut.NE:
            case InstructionShortcut_1.InstructionShortcut.LT:
            case InstructionShortcut_1.InstructionShortcut.LE:
            case InstructionShortcut_1.InstructionShortcut.HT:
            case InstructionShortcut_1.InstructionShortcut.HE:
                this.code.get(0).colour = ColourType_1.ColourType.Current;
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Current);
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                this.stack.get(this.stack.length() - 2).colour = ColourType_1.ColourType.SecondColoured;
                break;
            case InstructionShortcut_1.InstructionShortcut.CONS:
                this.code.get(0).colour = ColourType_1.ColourType.Current;
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Current);
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                this.stack.get(this.stack.length() - 2).colour = ColourType_1.ColourType.SecondColoured;
                break;
            case InstructionShortcut_1.InstructionShortcut.LDF:
                this.code.get(1).colour = ColourType_1.ColourType.Coloured;
                this.code.get(1).getNode().setColour(ColourType_1.ColourType.Coloured);
                break;
            case InstructionShortcut_1.InstructionShortcut.AP:
                element = this.stack.get(this.stack.length() - 1).get(0);
                element.colour = ColourType_1.ColourType.Current;
                element.getNode().setColour(ColourType_1.ColourType.Current);
                this.stack.get(this.stack.length() - 2).forEach(node => node.colour = ColourType_1.ColourType.Coloured);
                this.stack.get(0).forEach(element => element.getNode().setColour(ColourType_1.ColourType.Coloured));
                break;
            case InstructionShortcut_1.InstructionShortcut.RAP:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Current;
                this.stack.get(this.stack.length() - 1).getNode().colour = ColourType_1.ColourType.Current;
                this.stack.get(this.stack.length() - 2).colour = ColourType_1.ColourType.Coloured;
                this.stack.get(this.stack.length() - 2).getNode().colour = ColourType_1.ColourType.Coloured;
                break;
            case InstructionShortcut_1.InstructionShortcut.RTN:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Return;
                this.code.get(this.code.length() - 1).getNode().setColour(ColourType_1.ColourType.Current);
                this.dump.get(this.dump.length() - 1).colour = ColourType_1.ColourType.ThirdColoured;
                this.dump.get(this.dump.length() - 2).colour = ColourType_1.ColourType.SecondColoured;
                this.dump.get(this.dump.length() - 3).colour = ColourType_1.ColourType.Coloured;
                break;
            case InstructionShortcut_1.InstructionShortcut.DEFUN:
                this.environment.get(0).colour = ColourType_1.ColourType.Coloured;
                break;
            default:
                throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        }
    }
    applyInstruction(val) {
        let instructionShortcut = val.val;
        let currNode = this.code.get(0).getNode();
        this.code.shift();
        let node2;
        let node;
        let tmpArr = new SECDArray_1.SECDArray();
        let tmpArr2 = new SECDArray_1.SECDArray(), tmpArr3;
        //@ts-ignore
        switch (InstructionShortcut_1.InstructionShortcut[instructionShortcut]) {
            case InstructionShortcut_1.InstructionShortcut.LDC:
                tmpArr.push(this.code.shift());
                this.stack.push(tmpArr.get(0));
                break;
            case InstructionShortcut_1.InstructionShortcut.LD:
                node = this.code.get(0).getNode();
                tmpArr.push(this.code.shift());
                tmpArr3 = tmpArr.get(0);
                let loaded = this.evaluateLoad(tmpArr3.get(0).val, tmpArr3.get(1).val);
                if (loaded instanceof SECDValue_1.SECDValue)
                    this.logger.info("loading value: " + loaded);
                else
                    this.logger.info("loading array");
                if (typeof loaded != "undefined") {
                    node2 = this.code.getNode();
                    if (node2 instanceof AST_1.TopNode || node2 instanceof AST_1.MainNode || node2 instanceof AST_1.DefineNode || node2 instanceof AST_1.LambdaNode)
                        node2.loadVariable(node.variable, loaded.getNode());
                    /*else
                        (<InnerNode> node2._parent).loadVariable(node.variable, <InnerNode>loaded.getNode())*/
                    if (loaded instanceof SECDArray_1.SECDArray)
                        this.stack.push(loaded);
                    else if (loaded instanceof SECDValue_1.SECDValue)
                        this.stack.push(new SECDValue_1.SECDValue(loaded.val, loaded.node));
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.SEL:
                this.evaluateIf(this.stack.pop(), this.code.shift(), this.code.shift(), val);
                break;
            case InstructionShortcut_1.InstructionShortcut.JOIN:
                this._code = this.dump.pop();
                break;
            case InstructionShortcut_1.InstructionShortcut.NIL:
                //this.logger.info("loading empty list")
                tmpArr = new SECDArray_1.SECDArray();
                this.stack.push(tmpArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.DUM:
                tmpArr = new SECDArray_1.SECDArray();
                this.environment.push(tmpArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.CONSP:
            case InstructionShortcut_1.InstructionShortcut.CAR:
            case InstructionShortcut_1.InstructionShortcut.CDR:
                this.evaluateUnaryExpression(this.stack.pop(), instructionShortcut);
                break;
            case InstructionShortcut_1.InstructionShortcut.ADD:
            case InstructionShortcut_1.InstructionShortcut.SUB:
            case InstructionShortcut_1.InstructionShortcut.MUL:
            case InstructionShortcut_1.InstructionShortcut.DIV:
            case InstructionShortcut_1.InstructionShortcut.EQ:
            case InstructionShortcut_1.InstructionShortcut.NE:
            case InstructionShortcut_1.InstructionShortcut.LT:
            case InstructionShortcut_1.InstructionShortcut.LE:
            case InstructionShortcut_1.InstructionShortcut.HT:
            case InstructionShortcut_1.InstructionShortcut.HE:
                this.evaluateBinaryExpression(this.stack.pop(), this.stack.pop(), val);
                break;
            case InstructionShortcut_1.InstructionShortcut.CONS:
                tmpArr.push(this.stack.pop());
                tmpArr2 = this.stack.pop();
                tmpArr2.push(tmpArr.pop());
                this.stack.push(tmpArr2);
                break;
            case InstructionShortcut_1.InstructionShortcut.LDF:
                tmpArr.push(this.code.shift());
                tmpArr.push(this.environment);
                //tmpArr.get(1).setNode(this.code.get(this.code.length() - 1).getNode())
                this.logger.info("loading function: " + tmpArr.get(0) /*+ " in environment: " + tmpArr[1]*/);
                tmpArr.node = tmpArr.get(0).getNode();
                this.stack.push(tmpArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.AP:
                tmpArr.push(this.stack.pop());
                tmpArr.push(this.stack.pop());
                this.dump.push(this.cloneArray(this.stack));
                this.dump.push(this.cloneArray(this.code));
                this.dump.push(this.cloneArray(this.environment));
                tmpArr3 = tmpArr.get(0);
                this.code = this.cloneArray(tmpArr3.get(0));
                this.environment = this.cloneArray(tmpArr3.get(1));
                this.environment.push(tmpArr.get(1));
                this.stack.clear();
                this.logger.info("Applying function: " + this.code + " with arguments: " + this.environment + "");
                break;
            case InstructionShortcut_1.InstructionShortcut.RAP:
                tmpArr.push(this.stack.pop());
                tmpArr.push(this.stack.pop());
                tmpArr.node = tmpArr.get(1).getNode();
                this._environment.arr[this.environment.length() - 1] = tmpArr.get(1);
                tmpArr.push(this.environment.pop());
                this.dump.push(this.cloneArray(this.stack));
                this.dump.push(this.cloneArray(this.code));
                this.dump.push(this.cloneArray(this.environment));
                this.environment.push(tmpArr.pop());
                tmpArr3 = tmpArr.get(0);
                this.code = tmpArr3.get(0);
                this.stack.clear();
                this.logger.info("Applying recursive function: " + this.code + " with arguments: " + this.environment + "");
                break;
            case InstructionShortcut_1.InstructionShortcut.RTN:
                tmpArr.push(this.stack.pop());
                if (this.lastInstruction)
                    this.lastInstruction.getNode().update(tmpArr.get(0).getNode());
                this.stack = new SECDArray_1.SECDArray();
                this.environment = new SECDArray_1.SECDArray();
                this.code = new SECDArray_1.SECDArray();
                this.environment = this.environment.concat(this.dump.pop());
                this.code = this.code.concat(this.dump.pop());
                this.stack = this.stack.concat(this.dump.pop());
                this.stack.push(tmpArr.get(0));
                this.logger.info("Returning from function, result: " + tmpArr.get(0));
                break;
            case InstructionShortcut_1.InstructionShortcut.DEFUN:
                if (this.environment.get(0) instanceof SECDArray_1.SECDArray) {
                    this.stack.get(this.stack.length() - 1).node = val.getNode().body;
                    this.environment.arr[0].push(this.stack.pop());
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            default:
                throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        }
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=Interpreter.js.map