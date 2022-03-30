"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SECDArray_1 = require("../utility/SECD/SECDArray");
const Instruction_1 = require("../utility/instructions/Instruction");
const Logger_1 = require("../logger/Logger");
const SECDValue_1 = require("../utility/SECD/SECDValue");
const InstructionShortcut_1 = require("../utility/instructions/InstructionShortcut");
const ColourType_1 = require("../utility/SECD/ColourType");
const AST_1 = require("../AST/AST");
const InterpreterErrors_1 = require("./InterpreterErrors");
const __1 = require("..");
const SECDInvalid_1 = require("../utility/SECD/SECDInvalid");
const SECDMacro_1 = require("../utility/SECD/SECDMacro");
class Interpreter {
    constructor(instructions, topNode, macroInterpreter, environment) {
        this._code = instructions;
        this._stack = new SECDArray_1.SECDArray();
        this._dump = new SECDArray_1.SECDArray();
        if (environment)
            this._environment = environment;
        else {
            this._environment = new SECDArray_1.SECDArray();
            this._environment.push(new SECDArray_1.SECDArray());
        }
        this.logger = new Logger_1.Logger();
        this._lastInstruction = new SECDValue_1.SECDValue(new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DUMMY));
        this._topNode = topNode;
        this.cleaned = true;
        this.jumpingToMacro = false;
        this.prevInterpreter = macroInterpreter ? macroInterpreter : null;
    }
    set lastInstruction(value) {
        this._lastInstruction = value;
    }
    get lastInstruction() {
        return this._lastInstruction;
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
        arr.forEach(item => other.push(item));
        other.node = arr.node;
        other.name = arr.name;
        return other;
    }
    evaluateUnaryExpression(arr, instructionShortcut, val) {
        this.logger.info("evaluating unary expression on target: " + arr);
        //@ts-ignore
        switch (InstructionShortcut_1.InstructionShortcut[instructionShortcut]) {
            case InstructionShortcut_1.InstructionShortcut.CONSP:
                let value = arr instanceof SECDArray_1.SECDArray ? 1 : 0;
                let node = new AST_1.ValueNode(value);
                let element = new SECDValue_1.SECDValue(value, node);
                val.getNode().update(node, false); //update correct node
                this.stack.push(element);
                break;
            case InstructionShortcut_1.InstructionShortcut.CAR:
                if (arr instanceof SECDArray_1.SECDArray && arr.node instanceof AST_1.CompositeNode) {
                    let node;
                    if (arr.node.parent instanceof AST_1.ReduceNode)
                        node = arr.node.parent.reduced().items()[0];
                    else
                        node = arr.node.items()[0];
                    let element = arr.shift();
                    element.node = node;
                    this.stack.push(element);
                    arr.node.update(node, false);
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.CDR:
                let arrClone;
                if (arr instanceof SECDArray_1.SECDArray && arr.node instanceof AST_1.CompositeNode) {
                    arrClone = new SECDArray_1.SECDArray(arr);
                    arrClone.shift();
                    let node = arr.node.clone();
                    node.popFront();
                    arr.node.update(node, false);
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                this.stack.push(arrClone);
                break;
        }
    }
    static boolToInt(bool) {
        return bool ? 1 : 0;
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
                break;
            case InstructionShortcut_1.InstructionShortcut.SUB:
                res = num1 - num2;
                break;
            case InstructionShortcut_1.InstructionShortcut.MUL:
                res = num1 * num2;
                break;
            case InstructionShortcut_1.InstructionShortcut.DIV:
                res = num1 / num2;
                break;
            case InstructionShortcut_1.InstructionShortcut.EQ:
                res = Interpreter.boolToInt(num1 == num2);
                break;
            case InstructionShortcut_1.InstructionShortcut.NE:
                res = Interpreter.boolToInt(num1 != num2);
                break;
            case InstructionShortcut_1.InstructionShortcut.LT:
                res = Interpreter.boolToInt(num1 < num2);
                break;
            case InstructionShortcut_1.InstructionShortcut.LE:
                res = Interpreter.boolToInt(num1 <= num2);
                break;
            case InstructionShortcut_1.InstructionShortcut.HT:
                res = Interpreter.boolToInt(num1 > num2);
                break;
            case InstructionShortcut_1.InstructionShortcut.HE:
                res = Interpreter.boolToInt(num1 >= num2);
                break;
        }
        this.push(this.stack, res);
        node = new AST_1.ValueNode(res);
        let element = this.stack.get(this.stack.length() - 1);
        element.node = node;
        instruction.getNode().update(node, false);
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
        val.getNode().update(this._code.getNode(), false);
        this.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
    }
    evaluateLoad(num1, num2) {
        let x = this.environment.length() - num1 - 1;
        let innerArr = this.environment.get(x);
        if (innerArr instanceof SECDArray_1.SECDArray) {
            let loaded = innerArr.get(innerArr.length() - num2 - 1);
            return loaded;
        }
        throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
    }
    step() {
        if (this._lastInstruction.val.shortcut !== InstructionShortcut_1.InstructionShortcut.DUMMY) {
            let step = this.applyInstruction(this._lastInstruction);
            if (step)
                return step;
        }
        let code = this.code;
        if (code.length() == 0) {
            this.clean();
            if (this.prevInterpreter) {
                this.prevInterpreter.stack.push(this._stack.pop());
                this.prevInterpreter.lastInstruction.val.shortcut = InstructionShortcut_1.InstructionShortcut.DUMMY;
                return this.prevInterpreter;
            }
            else {
                console.log("Result: ", this.stack.get(0));
                return this;
            }
        }
        try {
            this._lastInstruction = code.get(0);
            this.colourArray(this._lastInstruction.val);
        }
        catch (exception) {
        }
        return this;
    }
    clean() {
        this._topNode.clean();
        this.code.clearPrinted();
        this.code.clean();
        this.stack.clearPrinted();
        this.stack.clean();
        this.dump.clearPrinted();
        this.dump.clean();
        this.environment.clearPrinted();
        this.environment.clean();
        this.cleaned = true;
    }
    colourArray(instructionShortcut) {
        let element;
        if (!this.cleaned)
            this.clean();
        this.code.get(0).colour = ColourType_1.ColourType.Current;
        let node;
        //@ts-ignore
        switch (InstructionShortcut_1.InstructionShortcut[instructionShortcut]) {
            case InstructionShortcut_1.InstructionShortcut.LDC:
                element = this.code.get(1);
                element.getNode().setColour(ColourType_1.ColourType.Coloured);
                element.colour = ColourType_1.ColourType.Coloured;
                break;
            case InstructionShortcut_1.InstructionShortcut.LD:
                this.code.get(1).getNode().setColour(ColourType_1.ColourType.Current);
                element = this.code.get(1);
                let loaded;
                if (element instanceof SECDArray_1.SECDArray) {
                    element.colour = ColourType_1.ColourType.Current;
                    loaded = this.evaluateLoad((element).get(0).val, (element).get(1).val);
                    if (loaded.getNode().parent instanceof AST_1.QuoteNode) { //If it is quoted list colour it all
                        loaded.getNode().parent.colour = ColourType_1.ColourType.Coloured;
                        loaded.getNode().parent.setColour(ColourType_1.ColourType.Coloured);
                    }
                    else {
                        loaded.colour = ColourType_1.ColourType.Coloured;
                        loaded.getNode().setColour(ColourType_1.ColourType.Coloured);
                    }
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.SEL:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                let ifNode = this.code.get(0).getNode();
                ifNode.setColour(ColourType_1.ColourType.Current);
                ifNode.condition().setColour(ColourType_1.ColourType.Coloured);
                ifNode.left().setColour(ColourType_1.ColourType.SecondColoured);
                ifNode.right().setColour(ColourType_1.ColourType.ThirdColoured);
                this.code.get(1).colour = ColourType_1.ColourType.SecondColoured;
                this.code.get(2).colour = ColourType_1.ColourType.ThirdColoured;
                break;
            case InstructionShortcut_1.InstructionShortcut.JOIN:
                this.dump.get(this.dump.length() - 1).colour = ColourType_1.ColourType.Coloured;
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Coloured);
                break;
            case InstructionShortcut_1.InstructionShortcut.NIL:
                break;
            case InstructionShortcut_1.InstructionShortcut.DUM:
                break;
            case InstructionShortcut_1.InstructionShortcut.POP:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                break;
            case InstructionShortcut_1.InstructionShortcut.CONSP:
            case InstructionShortcut_1.InstructionShortcut.CAR:
            case InstructionShortcut_1.InstructionShortcut.CDR:
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Current);
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
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Current);
                this.code.get(0).getNode().left().setColour(ColourType_1.ColourType.Coloured);
                this.code.get(0).getNode().right().setColour(ColourType_1.ColourType.SecondColoured);
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                this.stack.get(this.stack.length() - 2).colour = ColourType_1.ColourType.SecondColoured;
                break;
            case InstructionShortcut_1.InstructionShortcut.CONS:
            case InstructionShortcut_1.InstructionShortcut.CONC: /*
                let secondOnstack = this.stack.get(this.stack.length() - 2)
                if(secondOnstack instanceof SECDArray)
                    if(secondOnstack.length() == 0)
                        secondOnstack.node = this.code.get(0).node//If cons called on empty array without node it should be coloured*/
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Coloured);
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Coloured;
                this.stack.get(this.stack.length() - 2).colour = ColourType_1.ColourType.SecondColoured;
                break;
            case InstructionShortcut_1.InstructionShortcut.LDF:
                this.code.get(1).colour = ColourType_1.ColourType.Coloured;
                this.code.get(1).getNode().setColour(ColourType_1.ColourType.Coloured);
                break;
            case InstructionShortcut_1.InstructionShortcut.AP:
                element = this.stack.get(this.stack.length() - 1);
                element.colour = ColourType_1.ColourType.Current;
                node = element.getNode();
                node.setColour(ColourType_1.ColourType.Current);
                if (node.parent instanceof AST_1.ReduceNode || node.parent instanceof AST_1.TopNode || node.parent instanceof AST_1.LetNode) {
                    //If argument is list colour it whole
                    if (this.stack.get(this.stack.length() - 2).node instanceof AST_1.QuoteNode)
                        this.stack.get(this.stack.length() - 2).node.setColour(ColourType_1.ColourType.Coloured);
                    //Because of recursive functions where argument is in code just once
                    else
                        this.stack.get(this.stack.length() - 2).forEach(element => element.getNode().setColour(ColourType_1.ColourType.Coloured));
                }
                else {
                    //Normal non recursive lambdas
                    //Here argument will be highlited even if it is variable in code
                    let args = node.parent.args();
                    if (args instanceof AST_1.ReduceNode)
                        args.reduced().items().forEach(node => node.setColour(ColourType_1.ColourType.Coloured));
                    else
                        args.items().forEach(node => node.setColour(ColourType_1.ColourType.Coloured));
                }
                this.stack.get(this.stack.length() - 2).forEach(element => element.colour = ColourType_1.ColourType.Coloured);
                break;
            case InstructionShortcut_1.InstructionShortcut.RAP:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Current;
                this.stack.get(this.stack.length() - 1).getNode().colour = ColourType_1.ColourType.Current;
                this.stack.get(this.stack.length() - 2).colour = ColourType_1.ColourType.Coloured;
                this.stack.get(this.stack.length() - 2).getNode().colour = ColourType_1.ColourType.Coloured;
                break;
            case InstructionShortcut_1.InstructionShortcut.RTN:
                this.stack.get(this.stack.length() - 1).colour = ColourType_1.ColourType.Current;
                this.code.get(this.code.length() - 1).getNode().setColour(ColourType_1.ColourType.Current);
                this.dump.get(this.dump.length() - 2).colour = ColourType_1.ColourType.ThirdColoured;
                this.dump.get(this.dump.length() - 3).colour = ColourType_1.ColourType.SecondColoured;
                this.dump.get(this.dump.length() - 4).colour = ColourType_1.ColourType.Coloured;
                break;
            case InstructionShortcut_1.InstructionShortcut.DEFUN:
                this.code.get(0).getNode().setColour(ColourType_1.ColourType.Current);
                this.stack.get(0).colour = ColourType_1.ColourType.Current;
                break;
            case InstructionShortcut_1.InstructionShortcut.STOP:
                break;
            default:
                throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        }
        this.cleaned = false;
    }
    applyInstruction(val) {
        let instructionShortcut = val.val;
        let currNode = this.code.get(0).getNode();
        this.code.shift();
        let node2, newNode;
        let varNode;
        let tmpArr = new SECDArray_1.SECDArray();
        let tmpArr2 = new SECDArray_1.SECDArray(), closure;
        let invalid;
        //@ts-ignore
        switch (InstructionShortcut_1.InstructionShortcut[instructionShortcut]) {
            case InstructionShortcut_1.InstructionShortcut.LDC:
                tmpArr.push(this.code.shift());
                this.stack.push(tmpArr.get(0));
                break;
            case InstructionShortcut_1.InstructionShortcut.LD:
                varNode = this.code.get(0).getNode();
                tmpArr.push(this.code.shift());
                closure = tmpArr.get(0);
                let loaded = this.evaluateLoad(closure.get(0).val, closure.get(1).val);
                if (loaded.getNode().isLeaf()) {
                    //Last element of array should always have node that is parent of nodes of pervious elements
                    node2 = this.code.get(this.code.length() - 1).getNode();
                    newNode = loaded.getNode().clone();
                    node2.loadVariable(varNode.variable, newNode);
                    if (loaded instanceof SECDValue_1.SECDValue) {
                        this.logger.info("loading value: " + loaded);
                        this.stack.push(new SECDValue_1.SECDValue(loaded.val, newNode));
                    }
                    else { //Loading list
                        this.logger.info("loading array");
                        this.stack.push(loaded);
                    }
                }
                else {
                    this.logger.info("loading array");
                    node2 = tmpArr.get(0).getNode();
                    newNode = loaded.getNode().deapCopy();
                    if (node2.parent instanceof AST_1.LetNode)
                        node2.loadVariable(varNode.variable, newNode); // If recursive function called for the first time
                    this.stack.push(loaded);
                }
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
            case InstructionShortcut_1.InstructionShortcut.POP:
                this.stack.pop();
                break;
            case InstructionShortcut_1.InstructionShortcut.CONSP:
            case InstructionShortcut_1.InstructionShortcut.CAR:
            case InstructionShortcut_1.InstructionShortcut.CDR:
                this.evaluateUnaryExpression(this.stack.pop(), instructionShortcut, val);
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
            case InstructionShortcut_1.InstructionShortcut.CONS: /*
                let secondOnstack = this.stack.get(this.stack.length() - 2)
                if(secondOnstack instanceof SECDArray)
                    if(secondOnstack.length() == 0)
                        secondOnstack.node = new NullNode()//If we added node to empty array, remove it*/
                tmpArr.push(this.stack.pop());
                let tmpArr2 = this.stack.pop();
                if (!(tmpArr2 instanceof SECDArray_1.SECDArray)) {
                    throw new InterpreterErrors_1.InterpreterError("");
                }
                if (tmpArr2.length() == 0 && !(val.node instanceof AST_1.QuoteNode)) {
                    tmpArr2.push(tmpArr.pop());
                    tmpArr2.node = tmpArr.node;
                }
                else { //If composide node
                    tmpArr2.node = tmpArr.getNode().parent;
                    tmpArr2.push(tmpArr.pop());
                }
                this.stack.push(tmpArr2);
                break;
            case InstructionShortcut_1.InstructionShortcut.CONC:
                tmpArr.push(this.stack.pop());
                let macroArr = this.stack.pop();
                if (!(macroArr instanceof SECDArray_1.SECDArray)) {
                    throw new InterpreterErrors_1.InterpreterError("");
                }
                if (macroArr.get(0) instanceof SECDMacro_1.SECDMacro && tmpArr.get(0) instanceof SECDMacro_1.SECDMacro) {
                    macroArr.get(0).add(tmpArr.get(0));
                    this.stack.push(macroArr);
                    break;
                }
                if (macroArr.length() == 0 && !(val.node instanceof AST_1.QuoteNode)) {
                    macroArr.push(tmpArr.pop());
                    macroArr.node = tmpArr.node;
                }
                else { //If composide node
                    macroArr.node = tmpArr.getNode().parent;
                    macroArr.push(tmpArr.pop());
                }
                this.stack.push(macroArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.LDF:
                tmpArr.push(this.code.shift());
                tmpArr.push(this.environment);
                //tmpArr.push(this.cloneArray(this.environment))
                //tmpArr.get(1).setNode(this.code.get(this.code.length() - 1).getNode())
                this.logger.info("loading function: " + tmpArr.get(0) /*+ " in environment: " + tmpArr[1]*/);
                tmpArr.node = tmpArr.get(0).getNode();
                tmpArr.isClosure = true;
                this.stack.push(tmpArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.AP:
                tmpArr.push(this.stack.pop());
                tmpArr.push(this.stack.pop());
                closure = tmpArr.get(0);
                this.dump.push(this.cloneArray(this.stack)); //save stack to dump
                this.dump.push(this.cloneArray(this.code)); //save code to dump
                this.dump.push(this.cloneArray(this.environment)); //save environment to dump
                invalid = new SECDInvalid_1.SECDInvalid(); //Representing function before entering this new one
                //invalid.node = tmpArr3.node
                if (closure.node instanceof AST_1.LambdaNode || closure.node instanceof AST_1.DefineNode) { //If applying recursive function
                    invalid.node = closure.node.body();
                    invalid.otherNode = currNode;
                    invalid.otherNode.removeReduction();
                }
                this.dump.push(invalid);
                this.code = this.cloneArray(closure.get(0));
                this.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
                this.environment = this.cloneArray(closure.get(1));
                this.environment.push(tmpArr.get(1));
                this.stack.clear();
                this.logger.info("Applying function: " + this.code + " with arguments: " + this.environment + "");
                this.clean();
                if (closure.node instanceof AST_1.LambdaNode) {
                    closure.node.removeReduction();
                }
                this.code.removeReduction(); //Fix node parent when entering new function
                //this.stack.removeReduction()
                //this.environment.removeReduction()
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
                closure = tmpArr.get(0);
                invalid = new SECDInvalid_1.SECDInvalid();
                invalid.node = closure.node.clone();
                this.dump.push(invalid);
                //(<SECDArray> tmpArr.get(tmpArr.length() - 1)).name = GeneralUtils.getFunctionName(tmpArr3.getNode())
                this.code = this.cloneArray(closure.get(0));
                this.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
                /*closure.node.removeReduction()
                this.code.removeReduction()//Fix node parent when entering new function
                this.stack.removeReduction()*/
                this.stack.clear();
                this.logger.info("Applying recursive function: " + this.code + " with arguments: " + this.environment + "");
                break;
            case InstructionShortcut_1.InstructionShortcut.RTN:
                let tmp = this.stack.pop();
                tmp = tmp.clone();
                tmpArr.push(tmp);
                invalid = this.dump.pop();
                this.stack = new SECDArray_1.SECDArray();
                this.environment = new SECDArray_1.SECDArray();
                this.code = new SECDArray_1.SECDArray();
                this.environment = this.environment.concat(this.dump.pop());
                this.code = this.code.concat(this.dump.pop());
                this.stack = this.stack.concat(this.dump.pop());
                if (invalid.node instanceof AST_1.ReduceNode)
                    invalid.node.reduced().removeReduction();
                invalid.otherNode.update(tmpArr.get(0).getNode(), true); //update function node on place where it was called
                invalid.otherNode.parent._returned = true;
                this.stack.push(tmpArr.get(0));
                this.logger.info("Returning from function, result: " + tmpArr.get(0));
                break;
            case InstructionShortcut_1.InstructionShortcut.DEFUN:
                if (this.environment.get(0) instanceof SECDArray_1.SECDArray) {
                    let node = val.getNode();
                    this.stack.get(this.stack.length() - 1).node = node;
                    this.environment.get(0).push(this.stack.pop());
                    //this.environment.get(0).node = node
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.STOP:
                break;
            case InstructionShortcut_1.InstructionShortcut.MACRO:
                let parser = new __1.Parser();
                let macro = parser.parse(this.stack.pop().pop().macro);
                return new Interpreter(macro, parser.topNode, this, this.environment);
            default:
                throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        }
        return null;
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=Interpreter.js.map