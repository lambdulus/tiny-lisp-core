"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SECDArray_1 = require("../utility/SECD/SECDArray");
const Instruction_1 = require("../utility/instructions/Instruction");
const Logger_1 = require("../logger/Logger");
const SECDValue_1 = require("../utility/SECD/SECDValue");
const InstructionShortcut_1 = require("../utility/instructions/InstructionShortcut");
const AST_1 = require("../AST/AST");
const InterpreterErrors_1 = require("./InterpreterErrors");
const SECDInvalid_1 = require("../utility/SECD/SECDInvalid");
const InterpreterState_1 = require("./InterpreterState");
class Interpreter {
    constructor(instructions, topNode, environment) {
        this._state = new InterpreterState_1.InterpreterState(instructions, topNode, environment);
        this.logger = new Logger_1.Logger();
        this._lastInstruction = new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DUMMY);
        this.lastInstructionNode = new AST_1.NullNode();
        this.finished = false;
    }
    get state() {
        return this._state;
    }
    set lastInstruction(value) {
        this._lastInstruction = value;
    }
    get lastInstruction() {
        return this._lastInstruction;
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
    evaluateUnaryExpression(arr, instructionShortcut, instructionNode) {
        this.logger.info("evaluating unary expression on target: " + arr);
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut_1.InstructionShortcut.CONSP:
                let value = arr instanceof SECDArray_1.SECDArray ? 1 : 0;
                let node = new AST_1.ValueNode(value);
                let element = new SECDValue_1.SECDValue(value, node);
                instructionNode.update(node, false); //update instruction node
                this._state.stack.push(element);
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
                    this._state.stack.push(element);
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
                this._state.stack.push(arrClone);
                break;
        }
    }
    /**
     * Converts boolean valu to number one
     * @param bool
     * @private
     */
    static boolToInt(bool) {
        return bool ? 1 : 0;
    }
    /**
     * Computes result of operation on 2 SECDElements and pushes result on stack
     * @param val1
     * @param val2
     * @param instruction
     * @private
     */
    evaluateBinaryExpression(val1, val2, instructionShortcut, instructionNode) {
        let num1 = val1.constant;
        let num2 = val2.constant;
        if (typeof num1 != "number" || typeof num2 != "number")
            throw new InterpreterErrors_1.InterpreterError("Binary operator expects 2 number values");
        this.logger.info("evaluating binary expression on targets: " + num1 + " and " + num2);
        let node;
        let res = 0;
        //@ts-ignore
        switch (instructionShortcut) {
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
        this._state.stack.push(new SECDValue_1.SECDValue(res));
        node = new AST_1.ValueNode(res);
        let element = this._state.stack.get(this._state.stack.length() - 1);
        element.node = node;
        instructionNode.parent.update(node, false);
    }
    evaluateIf(expr, branch1, branch2, ifNode) {
        if (!(branch1 instanceof SECDArray_1.SECDArray) || !(branch2 instanceof SECDArray_1.SECDArray) || !(expr instanceof SECDValue_1.SECDValue))
            throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        this.logger.info("evaluating if with condition " + expr + " with branches: " + branch1 + " and " + branch2);
        this._state.dump.push(this.cloneArray(this._state.code));
        let cond = expr.constant;
        if (typeof (cond) != "number")
            throw new InterpreterErrors_1.InterpreterError("Element on top of the stack is not a number");
        if (cond)
            this._state.code = this.cloneArray(branch1);
        else
            this._state.code = this.cloneArray(branch2);
        //ifNode.update(<InnerNode> this._state.code.getNode(), false)//Update result of if statement
        this._state.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
    }
    static evaluateLoad(environment, num1, num2) {
        let x = environment.length() - num1 - 1;
        let innerArr = environment.get(x);
        if (innerArr instanceof SECDArray_1.SECDArray) {
            let loaded = innerArr.get(innerArr.length() - num2 - 1);
            return loaded.clone();
        }
        throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
    }
    step() {
        if ((this._lastInstruction).shortcut !== InstructionShortcut_1.InstructionShortcut.DUMMY) {
            this.applyInstruction(this._lastInstruction.shortcut, this.lastInstructionNode);
        }
        let code = this._state.code;
        if (code.length() == 0) {
            console.log("Result: ", this._state.stack.get(0));
            this.finished = true;
            return;
        }
        try {
            let lastConstant = code.get(0).constant;
            if (!(lastConstant instanceof Instruction_1.Instruction))
                throw new InterpreterErrors_1.InterpreterError("Element on top of code register is not instruction");
            this._lastInstruction = lastConstant;
            this.lastInstructionNode = code.get(0).getNode();
        }
        catch (exception) {
        }
    }
    run() {
        while (!this.finished)
            this.step();
    }
    applyInstruction(instructionShortcut, node) {
        let currNode = this._state.code.get(0).getNode();
        this._state.code.shift();
        let node2, newNode;
        let varNode;
        let tmpArr = new SECDArray_1.SECDArray();
        let tmpArr2 = new SECDArray_1.SECDArray(), indexesList, tmpArr3;
        let invalid;
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut_1.InstructionShortcut.LDC:
                tmpArr.push(this._state.code.shift());
                this._state.stack.push(tmpArr.get(0));
                break;
            case InstructionShortcut_1.InstructionShortcut.LD:
                varNode = this._state.code.get(0).getNode();
                tmpArr.push(this._state.code.shift());
                indexesList = tmpArr.get(0);
                if (!(indexesList instanceof SECDArray_1.SECDArray))
                    throw new InterpreterErrors_1.InterpreterError("LD is not followed by list of indexes");
                let index1 = indexesList.get(0);
                let index2 = indexesList.get(1);
                if (!(index1 instanceof SECDValue_1.SECDValue && index2 instanceof SECDValue_1.SECDValue))
                    throw new InterpreterErrors_1.InterpreterError("LD indexes must be values");
                let val1 = index1.constant;
                let val2 = index2.constant;
                if ((typeof (val1) != "number") && (typeof (val2) != "number"))
                    throw new InterpreterErrors_1.InterpreterError("LD indexes are not numbers");
                let loaded = Interpreter.evaluateLoad(this._state.environment, val1, val2);
                if (loaded.getNode().isLeaf()) {
                    //Last element of array should always have node that is parent of nodes of pervious elements
                    node2 = this._state.code.get(this._state.code.length() - 1).getNode();
                    newNode = loaded.getNode().clone();
                    node2.loadVariable(varNode.variable, newNode);
                    if (loaded instanceof SECDValue_1.SECDValue) {
                        this.logger.info("loading value: " + loaded);
                        this._state.stack.push(new SECDValue_1.SECDValue(loaded.constant, newNode));
                    }
                    else { //Loading list
                        this.logger.info("loading array");
                        this._state.stack.push(loaded);
                    }
                }
                else {
                    this.logger.info("loading array");
                    node2 = tmpArr.get(0).getNode();
                    newNode = loaded.getNode().deapCopy();
                    if (node2.parent instanceof AST_1.LetNode)
                        node2.loadVariable(varNode.variable, newNode); // If recursive function called for the first time
                    this._state.stack.push(loaded);
                }
                break;
            case InstructionShortcut_1.InstructionShortcut.SEL:
                this.evaluateIf(this._state.stack.pop(), this._state.code.shift(), this._state.code.shift(), node);
                break;
            case InstructionShortcut_1.InstructionShortcut.JOIN:
                this._state.code = this._state.dump.pop();
                break;
            case InstructionShortcut_1.InstructionShortcut.NIL:
                //this.logger.info("loading empty list")
                tmpArr = new SECDArray_1.SECDArray();
                this._state.stack.push(tmpArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.DUM:
                tmpArr = new SECDArray_1.SECDArray();
                this._state.environment.push(tmpArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.POP:
                this._state.stack.pop();
                break;
            case InstructionShortcut_1.InstructionShortcut.CONSP:
            case InstructionShortcut_1.InstructionShortcut.CAR:
            case InstructionShortcut_1.InstructionShortcut.CDR:
                this.evaluateUnaryExpression(this._state.stack.pop(), instructionShortcut, node);
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
                this.evaluateBinaryExpression(this._state.stack.pop(), this._state.stack.pop(), instructionShortcut, node);
                break;
            case InstructionShortcut_1.InstructionShortcut.CONS: /*
                let secondOnstack = this.stack.get(this.stack.length() - 2)
                if(secondOnstack instanceof SECDArray)
                    if(secondOnstack.length() == 0)
                        secondOnstack.node = new NullNode()//If we added node to empty array, remove it*/
                tmpArr.push(this._state.stack.pop());
                let tmpArr2 = this._state.stack.pop();
                if (!(tmpArr2 instanceof SECDArray_1.SECDArray)) {
                    throw new InterpreterErrors_1.InterpreterError("");
                }
                if (tmpArr2.length() == 0 && !(node instanceof AST_1.QuoteNode)) {
                    tmpArr2.push(tmpArr.pop());
                    tmpArr2.node = tmpArr.node;
                }
                else { //If composide node
                    tmpArr2.node = tmpArr.getNode().parent;
                    tmpArr2.push(tmpArr.pop());
                }
                this._state.stack.push(tmpArr2);
                break;
            case InstructionShortcut_1.InstructionShortcut.LDF:
                tmpArr.push(this._state.code.shift());
                tmpArr.push(this._state.environment);
                //tmpArr.push(this.cloneArray(this.environment))
                //tmpArr.get(1).setNode(this.code.get(this.code.length() - 1).getNode())
                this.logger.info("loading function: " + tmpArr.get(0) /*+ " in environment: " + tmpArr[1]*/);
                tmpArr.node = tmpArr.get(0).getNode();
                tmpArr.isClosure = true;
                this._state.stack.push(tmpArr);
                break;
            case InstructionShortcut_1.InstructionShortcut.AP:
                tmpArr.push(this._state.stack.pop());
                tmpArr.push(this._state.stack.pop());
                tmpArr3 = tmpArr.get(0);
                this._state.dump.push(this.cloneArray(this._state.stack)); //save stack to dump
                this._state.dump.push(this.cloneArray(this._state.code)); //save code to dump
                this._state.dump.push(this.cloneArray(this._state.environment)); //save environment to dump
                invalid = new SECDInvalid_1.SECDInvalid(); //Representing function before entering this new one
                //invalid.node = tmpArr3.node
                if (tmpArr3.node instanceof AST_1.LambdaNode || tmpArr3.node instanceof AST_1.DefineNode) { //If applying recursive function
                    invalid.node = tmpArr3.node.body();
                    invalid.otherNode = currNode;
                    invalid.otherNode.removeReduction();
                }
                this._state.dump.push(invalid);
                this._state.code = this.cloneArray(tmpArr3.get(0));
                this._state.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
                this._state.environment = this.cloneArray(tmpArr3.get(1));
                this._state.environment.push(tmpArr.get(1));
                this._state.stack.clear();
                this.logger.info("Applying function: " + this._state.code + " with arguments: " + this._state.environment + "");
                if (tmpArr3.node instanceof AST_1.LambdaNode) {
                    tmpArr3.node.removeReduction();
                }
                this._state.code.removeReduction(); //Fix node parent when entering new function
                //this.stack.removeReduction()
                //this.environment.removeReduction()
                break;
            case InstructionShortcut_1.InstructionShortcut.RAP:
                tmpArr.push(this._state.stack.pop());
                tmpArr.push(this._state.stack.pop());
                tmpArr.node = tmpArr.get(1).getNode();
                this._state.environment.arr[this._state.environment.length() - 1] = tmpArr.get(1);
                tmpArr.push(this._state.environment.pop());
                this._state.dump.push(this.cloneArray(this._state.stack));
                this._state.dump.push(this.cloneArray(this._state.code));
                this._state.dump.push(this.cloneArray(this._state.environment));
                this._state.environment.push(tmpArr.pop());
                indexesList = tmpArr.get(0);
                invalid = new SECDInvalid_1.SECDInvalid();
                invalid.node = indexesList.node.clone();
                this._state.dump.push(invalid);
                //(<SECDArray> tmpArr.get(tmpArr.length() - 1)).name = GeneralUtils.getFunctionName(tmpArr3.getNode())
                this._state.code = this.cloneArray(indexesList.get(0));
                this._state.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
                /*closure.node.removeReduction()
                this.code.removeReduction()//Fix node parent when entering new function
                this.stack.removeReduction()*/
                this._state.stack.clear();
                this.logger.info("Applying recursive function: " + this._state.code + " with arguments: " + this._state.environment + "");
                break;
            case InstructionShortcut_1.InstructionShortcut.RTN:
                let tmp = this._state.stack.pop();
                tmp = tmp.clone();
                tmpArr.push(tmp);
                invalid = this._state.dump.pop();
                this._state.stack = new SECDArray_1.SECDArray();
                this._state.environment = new SECDArray_1.SECDArray();
                this._state.code = new SECDArray_1.SECDArray();
                this._state.environment = this._state.environment.concat(this._state.dump.pop());
                this._state.code = this._state.code.concat(this._state.dump.pop());
                this._state.stack = this._state.stack.concat(this._state.dump.pop());
                if (invalid.node instanceof AST_1.ReduceNode)
                    invalid.node.reduced().removeReduction();
                invalid.otherNode.update(tmpArr.get(0).getNode(), true); //update function node on place where it was called
                invalid.otherNode.parent._returned = true;
                this._state.stack.push(tmpArr.get(0));
                this.logger.info("Returning from function, result: " + tmpArr.get(0));
                break;
            case InstructionShortcut_1.InstructionShortcut.DEFUN:
                if (this._state.environment.get(0) instanceof SECDArray_1.SECDArray) {
                    this._state.stack.get(this._state.stack.length() - 1).node = node;
                    this._state.environment.get(0).push(this._state.stack.pop());
                    //this.environment.get(0).node = node
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.STOP:
                break;
            default:
                throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        }
        return null;
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=Interpreter.js.map