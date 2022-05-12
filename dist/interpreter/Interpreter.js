"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
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
        this._state = new InterpreterState_1.InterpreterState(instructions.reverse(), topNode, environment);
        this.logger = new Logger_1.Logger();
        this._lastInstruction = new Instruction_1.Instruction(InstructionShortcut_1.InstructionShortcut.DUMMY);
        this.lastInstructionNode = new AST_1.NullNode();
        this.finished = false;
        this.returned = false;
        this.lastFuncApplicationNode = new AST_1.NullNode();
        this._gensymVars = Array("gensym");
    }
    get gensymVars() {
        return this._gensymVars;
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
                        throw new InterpreterErrors_1.InterpreterError("The CAR instruction called on an empty array");
                    }
                    let newVal = val.clone();
                    let node = newVal.node.items()[0];
                    let element = newVal.shift();
                    element.node = node;
                    this._state.stack.push(element);
                    newVal.node.update(node, false);
                    val = newVal;
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("The CAR instruction called on an empty array");
                break;
            case InstructionShortcut_1.InstructionShortcut.CDR:
                if (val instanceof SECDArray_1.SECDArray && val.node instanceof AST_1.CompositeNode) {
                    if (val.length() == 0) {
                        throw new InterpreterErrors_1.InterpreterError("The CDR instruction called on an empty array");
                    }
                    let newVal = val.clone();
                    newVal.shift();
                    let node = newVal.node.clone();
                    node.popFront();
                    newVal.node.update(node, false);
                    newVal.node = node;
                    val = newVal;
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("The CDR instruction called on an empty array");
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
        let element = new SECDValue_1.SECDValue(res);
        this._state.stack.push(element);
        node = new AST_1.ValueNode(res);
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
        }
        else {
            this._state.code = branch2.clone(); //It is always SECDArray
        }
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
            console.log("Result: ", this._state.stack.get(this._state.stack.length() - 1));
            this.finished = true;
            this.lastInstruction.shortcut = InstructionShortcut_1.InstructionShortcut.DUMMY;
            return;
        }
        try {
            let lastConstant = code.get(this._state.code.length() - 1).constant;
            if (!(lastConstant instanceof Instruction_1.Instruction))
                throw new InterpreterErrors_1.InterpreterError("Element on top of code register is not instruction");
            this._lastInstruction = lastConstant;
            this.lastInstructionNode = code.get(this._state.code.length() - 1).node;
        }
        catch (exception) {
        }
    }
    /**
     * Runs interpreter until code register is empty
     */
    run() {
        let x = 0;
        while (!this.finished) {
            this.step();
            x++;
        }
        console.log("Steps: ", x);
    }
    /**
     *
     * @param instructionShortcut - instruction to be executed
     * @param lastInstructionNode  - node of the instruction
     * @private
     */
    applyInstruction(instructionShortcut, lastInstructionNode) {
        let currNode = this._state.code.get(this.state.code.length() - 1).node;
        this._state.code.pop();
        let codeRegisterNode, loadedValueNode;
        let varNode;
        let tmpArr = new SECDArray_1.SECDArray();
        let tmpArr2 = new SECDArray_1.SECDArray(), argumentsOfFunction, indecedList, closure;
        let hidden;
        //@ts-ignore
        switch (instructionShortcut) {
            case InstructionShortcut_1.InstructionShortcut.LDC:
                this._state.stack.push(this._state.code.pop());
                break;
            case InstructionShortcut_1.InstructionShortcut.LD:
                varNode = this._state.code.get(this.state.code.length() - 1).node;
                indecedList = this._state.code.pop();
                if (!(indecedList instanceof SECDArray_1.SECDArray))
                    throw new InterpreterErrors_1.InterpreterError("LD is not followed by list of indexes");
                let index1 = indecedList.get(1);
                let index2 = indecedList.get(0);
                if (!(index1 instanceof SECDValue_1.SECDValue && index2 instanceof SECDValue_1.SECDValue))
                    throw new InterpreterErrors_1.InterpreterError("LD indexes must be values");
                let val1 = index1.constant;
                let val2 = index2.constant;
                if ((typeof (val1) != "number") && (typeof (val2) != "number"))
                    throw new InterpreterErrors_1.InterpreterError("LD indexes are not numbers");
                if (val1 == -10 && val2 == -10) { //If loading gensym
                    let variable = __1.InterpreterUtils.gensym(this);
                    this._state.stack.push(new SECDValue_1.SECDValue(variable, new AST_1.StringNode(variable)));
                }
                else {
                    let loaded = __1.InterpreterUtils.evaluateLoad(this._state.environment, val1, val2);
                    loadedValueNode = loaded.node;
                    if (loaded.node.isValue()) {
                        //Last element of array should always have node that is parent of nodes of pervious elements
                        if (this.returned) //If continuing evaluating a function after returning from this function
                            this.lastFuncApplicationNode.loadVariable(varNode.variable, loadedValueNode);
                        else {
                            this._state.code.get(0).node.loadVariable(varNode.variable, loadedValueNode);
                        }
                        if (loaded instanceof SECDValue_1.SECDValue) {
                            this.logger.info("loading value: " + loaded);
                            this._state.stack.push(new SECDValue_1.SECDValue(loaded.constant, loadedValueNode));
                        }
                        else { //Loading list
                            this.logger.info("loading array");
                            this._state.stack.push(loaded);
                        }
                    }
                    else { //Loading fce
                        this.logger.info("loading fce");
                        codeRegisterNode = indecedList.node;
                        if (codeRegisterNode.parent instanceof AST_1.LetNode)
                            codeRegisterNode.loadVariable(varNode.variable, loadedValueNode); // If recursive function called for the first time
                        this._state.stack.push(loaded);
                    }
                }
                break;
            case InstructionShortcut_1.InstructionShortcut.SEL:
                this.evaluateSEL(this._state.stack.pop(), this._state.code.pop(), this._state.code.pop(), lastInstructionNode);
                this.returned = false;
                break;
            case InstructionShortcut_1.InstructionShortcut.JOIN:
                this._state.code = this._state.dump.pop();
                break;
            case InstructionShortcut_1.InstructionShortcut.NIL:
                this._state.stack.push(new SECDArray_1.SECDArray());
                break;
            case InstructionShortcut_1.InstructionShortcut.DUM:
                this._state.environment.push(new SECDArray_1.SECDArray());
                break;
            case InstructionShortcut_1.InstructionShortcut.POP:
                this._state.stack.pop();
                break;
            case InstructionShortcut_1.InstructionShortcut.CONSP:
            case InstructionShortcut_1.InstructionShortcut.CAR:
            case InstructionShortcut_1.InstructionShortcut.CDR:
                this.evaluateUnaryOperator(this._state.stack.pop(), instructionShortcut, lastInstructionNode);
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
                this.evaluateBinaryOperator(this._state.stack.pop(), this._state.stack.pop(), instructionShortcut, lastInstructionNode);
                break;
            case InstructionShortcut_1.InstructionShortcut.CONS:
                let arg2 = this._state.stack.pop();
                let arg1 = this._state.stack.pop();
                let res;
                if (arg1 instanceof SECDArray_1.SECDArray) { //If first element is already SECDArray push second element there
                    if (arg1.length() == 0) {
                        arg1.push(arg2);
                        //If the node is a binding (its parent is a BindNode), 
                        arg1.node = !(arg2.node.parent instanceof AST_1.BindNode) ? new AST_1.CompositeNode(Array(arg2.node)) : new AST_1.CompositeNode(Array(arg2.node.parent));
                    }
                    else { //If composide node
                        arg1.push(arg2);
                        if (arg2.node.parent instanceof AST_1.BindNode) { //If this is expression of a binding, add node of the binding
                            arg1.node.addItemBack(arg2.node.parent);
                        }
                        else {
                            arg1.node.addItemBack(arg2.node);
                        }
                    }
                    res = arg1;
                }
                else if (arg1 instanceof SECDValue_1.SECDValue) {
                    //If first element is SECDValue, create an SECDArray and push both arguments there
                    res = new SECDArray_1.SECDArray();
                    res.push(arg1);
                    if (arg2 instanceof SECDArray_1.SECDArray) {
                        //If second element is SECDArray, we essentialy create a chain of cons cells => list of first all elements
                        arg2.forEach(element => res.push(element));
                        res.node = arg2.node;
                        res.node.addItemFront(arg1.node);
                    }
                    else if (arg2 instanceof SECDValue_1.SECDValue) {
                        //create whole new list, so create new SECD array
                        res.push(arg2);
                        res.node = new AST_1.CompositeNode(Array(arg1.node, arg2.node));
                    }
                }
                else {
                    throw new InterpreterErrors_1.InterpreterError("Called cons on unsupported type of SECDElement");
                }
                this._state.stack.push(res);
                break;
            case InstructionShortcut_1.InstructionShortcut.LDF:
                closure = new SECDArray_1.SECDArray();
                //create closure
                //environment will be first to render nicely on frontend
                closure.push(this._state.environment);
                closure.push(this._state.code.pop());
                this.logger.info("loading function: " + closure.get(1));
                closure.node = closure.get(1).node;
                this._state.stack.push(closure);
                break;
            case InstructionShortcut_1.InstructionShortcut.AP:
                closure = this._state.stack.pop();
                argumentsOfFunction = this._state.stack.pop();
                this._state.dump.push(this._state.stack.clone()); //save stack to dump
                this._state.dump.push(this._state.code.clone()); //save code to dump
                this._state.dump.push(this._state.environment.clone()); //save environment to dump
                hidden = new SECDHidden_1.SECDHidden(); //Representing function before entering this new one
                if (closure.node instanceof AST_1.LambdaNode || closure.node instanceof AST_1.DefineNode) {
                    //prepare for possibility of the function being recursive
                    hidden.node = closure.node.body();
                    hidden.callNode = currNode;
                    hidden.callNode.removeReduction(); //remove reduce nodes in the node of the application
                }
                this._state.dump.push(hidden);
                this._state.code = closure.get(1).clone(); // It is always SECDArray
                this._state.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
                this._state.environment = closure.get(0).clone(); //It is always SECDArray
                this._state.environment.push(argumentsOfFunction); //Push arguments of the function to environment
                this._state.stack.clear();
                this.logger.info("Applying function: " + this._state.code + " with arguments: " + this._state.environment + "");
                if (closure.node instanceof AST_1.LambdaNode) {
                    closure.node.removeReduction(); //remove reduce nodes in the body of the function
                }
                this._state.code.removeReduction(); //Fix parents of nodes when entering new function
                this.returned = false; //New function will be evaluated from its beginning
                break;
            case InstructionShortcut_1.InstructionShortcut.RAP:
                closure = this._state.stack.pop();
                argumentsOfFunction = this._state.stack.pop();
                this._state.environment.arr[this._state.environment.length() - 1] = argumentsOfFunction;
                this._state.dump.push(this._state.stack.clone()); //save stack to dump
                this._state.dump.push(this._state.code.clone()); //save code to dump
                this._state.dump.push(this._state.environment.clone()); //save environment to dump
                this._state.environment.push(this._state.environment.pop());
                hidden = new SECDHidden_1.SECDHidden();
                hidden.node = closure.node;
                this._state.dump.push(hidden);
                this._state.code = closure.get(1).clone();
                this._state.code.node = new AST_1.NullNode(); //We no longer need this node(It would cause unnessesary colouring)
                this._state.stack.clear();
                this.logger.info("Applying recursive function: " + this._state.code + " with arguments: " + this._state.environment + "");
                this.returned = false;
                break;
            case InstructionShortcut_1.InstructionShortcut.RTN:
                //clone returned value
                let returnedVal = this._state.stack.pop().clone();
                hidden = this._state.dump.pop();
                this._state.stack = new SECDArray_1.SECDArray();
                this._state.environment = new SECDArray_1.SECDArray();
                this._state.code = new SECDArray_1.SECDArray();
                //Pop registers backup from dump
                this._state.environment = this._state.environment.concat(this._state.dump.pop());
                this._state.code = this._state.code.concat(this._state.dump.pop());
                this._state.stack = this._state.stack.concat(this._state.dump.pop());
                if (hidden.node) {
                    hidden.node.removeReduction();
                    //Set node of last function application in this funciton
                    if (hidden.callNode.parent instanceof AST_1.ReduceNode)
                        this.lastFuncApplicationNode = hidden.callNode.parent.parent;
                    else
                        this.lastFuncApplicationNode = hidden.callNode.parent;
                    hidden.callNode.update(returnedVal.node, true); //update function node on place where it was called
                }
                this._state.stack.push(returnedVal);
                this.logger.info("Returning from function, result: " + returnedVal);
                this.returned = true; //Function stoped evaluating somewhere in the middle
                break;
            case InstructionShortcut_1.InstructionShortcut.DEFUN:
                if (this._state.environment.get(0) instanceof SECDArray_1.SECDArray) {
                    this._state.stack.get(this._state.stack.length() - 1).node = lastInstructionNode;
                    this._state.environment.get(0).push(this._state.stack.pop());
                }
                else
                    throw new InterpreterErrors_1.InterpreterError("List for global functions is not a list"); //This hopefully should not even happen
                break;
            case InstructionShortcut_1.InstructionShortcut.STOP:
                break;
            default:
                throw new InterpreterErrors_1.InterpreterError("Unexpected instrution");
        }
        return null;
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=Interpreter.js.map