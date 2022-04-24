"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SECDArray_1 = require("../SECD/SECDArray");
const Instruction_1 = require("../SECD/instructions/Instruction");
const Logger_1 = require("../logger/Logger");
const SECDValue_1 = require("../SECD/SECDValue");
const InstructionShortcut_1 = require("../SECD/instructions/InstructionShortcut");
const AST_1 = require("../AST/AST");
const InterpreterErrors_1 = require("./InterpreterErrors");
const __1 = require("..");
const SECDHidden_1 = require("../SECD/SECDHidden");
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
    /**
     * Converts boolean value to number
     * @param bool
     * @private
     */
    static boolToInt(bool) {
        return bool ? 1 : 0;
    }
    /**
     * Evaluates unary operator
     * @param val                   - argument of the operator
     * @param instructionShortcut   - shortcut of the operator
     * @param instructionNode       - node of the unary expression
     * @private
     */
    evaluateUnaryOperator(val, instructionShortcut, instructionNode) {
        this.logger.info("evaluating unary expression on target: " + val);
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut_1.InstructionShortcut.CONSP:
                let value = val instanceof SECDArray_1.SECDArray ? 1 : 0;
                let node = new AST_1.ValueNode(value);
                let element = new SECDValue_1.SECDValue(value, node);
                instructionNode.update(node, false); //update instruction node
                this._state.stack.push(element);
                break;
            case InstructionShortcut_1.InstructionShortcut.CAR:
                if (val instanceof SECDArray_1.SECDArray && val.node instanceof AST_1.CompositeNode) {
                    if (val.length() == 0) {
                        throw new InterpreterErrors_1.InterpreterError("CAR called on empty array");
                    }
                    let node = val.node.items()[0];
                    let element = val.shift();
                    element.node = node;
                    this._state.stack.push(element);
                    val.node.update(node, false);
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                break;
            case InstructionShortcut_1.InstructionShortcut.CDR:
                if (val instanceof SECDArray_1.SECDArray && val.node instanceof AST_1.CompositeNode) {
                    if (val.length() == 0) {
                        throw new InterpreterErrors_1.InterpreterError("CDR called on empty array");
                    }
                    val.shift();
                    let node = val.node.clone();
                    node.popFront();
                    val.node.update(node, false);
                    val.node = node;
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
                this._state.stack.push(val);
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
    evaluateBinaryOperator(val1, val2, instructionShortcut, instructionNode) {
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
    /**
     * Evaluate SEL instruction
     * @param condElement - condition
     * @param branch1     - first branch of if
     * @param branch2     - second branch of if
     * @param ifNode      - node of if
     * @private
     */
    evaluateSEL(condElement, branch1, branch2, ifNode) {
        if (!(branch1 instanceof SECDArray_1.SECDArray) || !(branch2 instanceof SECDArray_1.SECDArray) || !(condElement instanceof SECDValue_1.SECDValue))
            throw new InterpreterErrors_1.InterpreterError("Error in interpreter");
        this.logger.info("evaluating if with condition " + condElement + " with branches: " + branch1 + " and " + branch2);
        this._state.dump.push(this._state.code.clone());
        let cond = condElement.constant;
        if (typeof (cond) != "number")
            throw new InterpreterErrors_1.InterpreterError("Element on top of the stack is not a number");
        if (cond) {
            this._state.code = branch1.clone(); //It is always SECDArray
            ifNode.chosenBranch = 1;
        }
        else {
            this._state.code = branch2.clone(); //It is always SECDArray
            ifNode.chosenBranch = 2;
        }
        //ifNode.update(<InnerNode> this._state.code.getNode(), false)//Update result of if statement
        this._state.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
    }
    /**
     * Performs interpreter step
     */
    step() {
        if ((this._lastInstruction).shortcut !== InstructionShortcut_1.InstructionShortcut.DUMMY) {
            this.applyInstruction(this._lastInstruction.shortcut, this.lastInstructionNode);
        }
        let code = this._state.code;
        if (code.length() == 0) {
            console.log("Result: ", this._state.stack.get(0));
            this.finished = true;
            this.lastInstruction.shortcut = InstructionShortcut_1.InstructionShortcut.DUMMY;
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
    /**
     * Runs interpreter until code register is empty
     */
    run() {
        while (!this.finished) {
            this.step();
        }
    }
    /**
     *
     * @param instructionShortcut - instruction to be executed
     * @param node  - node of the instruction
     * @private
     */
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
                let loaded = __1.InterpreterUtils.evaluateLoad(this._state.environment, val1, val2);
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
                this.evaluateSEL(this._state.stack.pop(), this._state.code.shift(), this._state.code.shift(), node);
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
                this.evaluateUnaryOperator(this._state.stack.pop(), instructionShortcut, node);
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
                this.evaluateBinaryOperator(this._state.stack.pop(), this._state.stack.pop(), instructionShortcut, node);
                break;
            case InstructionShortcut_1.InstructionShortcut.CONS:
                let arg2 = this._state.stack.pop();
                let arg1 = this._state.stack.pop();
                let res;
                if (arg1 instanceof SECDArray_1.SECDArray) { //If first element is already SECDArray push second element there
                    if (arg1.length() == 0) {
                        arg1.push(arg2);
                        arg1.node = new AST_1.CompositeNode(Array(arg2.node));
                    }
                    else { //If composide node
                        arg1.push(arg2);
                        arg1.node.addItemBack(arg2.node);
                    }
                    res = arg1;
                }
                else if (arg1 instanceof SECDValue_1.SECDValue) { //If first element is SECDValue, create ne SECDArray and push both arguments there
                    res = new SECDArray_1.SECDArray();
                    res.push(arg1);
                    if (arg2 instanceof SECDArray_1.SECDArray) {
                        arg2.forEach(element => res.push(element));
                        res.node = arg2.node;
                        res.node.addItemFront(arg1.node);
                    }
                    else if (arg2 instanceof SECDValue_1.SECDValue) {
                        res.push(arg2);
                    }
                }
                else {
                    throw new InterpreterErrors_1.InterpreterError("Called cons on unsupported type of SECDElement");
                }
                this._state.stack.push(res);
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
                this._state.dump.push(this._state.stack.clone()); //save stack to dump
                this._state.dump.push(this._state.code.clone()); //save code to dump
                this._state.dump.push(this._state.environment.clone()); //save environment to dump
                invalid = new SECDHidden_1.SECDHidden(); //Representing function before entering this new one
                //invalid.node = tmpArr3.node
                if (tmpArr3.node instanceof AST_1.LambdaNode || tmpArr3.node instanceof AST_1.DefineNode) { //If applying recursive function
                    invalid.node = tmpArr3.node.body();
                    invalid.callNode = currNode;
                    invalid.callNode.removeReduction();
                }
                this._state.dump.push(invalid);
                this._state.code = tmpArr3.get(0).clone(); // It is always SECDArray
                this._state.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
                this._state.environment = tmpArr3.get(1).clone(); //It is always SECDArray
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
                this._state.dump.push(this._state.stack.clone());
                this._state.dump.push(this._state.code.clone());
                this._state.dump.push(this._state.environment.clone());
                this._state.environment.push(tmpArr.pop());
                indexesList = tmpArr.get(0);
                invalid = new SECDHidden_1.SECDHidden();
                invalid.node = indexesList.node.clone();
                this._state.dump.push(invalid);
                //(<SECDArray> tmpArr.get(tmpArr.length() - 1)).name = GeneralUtils.getFunctionName(tmpArr3.getNode())
                this._state.code = indexesList.get(0).clone();
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
                invalid.callNode.update(tmpArr.get(0).getNode(), true); //update function node on place where it was called
                invalid.callNode.parent._returned = true;
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