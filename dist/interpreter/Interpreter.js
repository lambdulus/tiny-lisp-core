"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
const SECDArray_1 = require("../parser/SECDArray");
const Instructions_1 = require("../instructions/Instructions");
const Logger_1 = require("../logger/Logger");
class Interpreter {
    constructor(instructions) {
        this._code = instructions;
        this._stack = new SECDArray_1.SECDArray();
        this._dump = new SECDArray_1.SECDArray();
        this._environment = new SECDArray_1.SECDArray();
        this.environment.push(new SECDArray_1.SECDArray());
        this.logger = new Logger_1.Logger();
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
    cloneArray(arr) {
        let other = new SECDArray_1.SECDArray();
        arr.forEach(val => other.push(val));
        return other;
    }
    evaluateUnaryExpression(arr, instruction) {
        this.logger.info("evaluating unary expression on target: " + arr);
        //@ts-ignore
        switch (Instructions_1.Instruction[instruction]) {
            case Instructions_1.Instruction.CONSP:
                this.stack.push(Array.isArray(arr));
                break;
            case Instructions_1.Instruction.CAR:
                if (Array.isArray(arr))
                    this.stack.push(arr.shift());
                //else Runtime Error
                break;
            case Instructions_1.Instruction.CDR:
                if (Array.isArray(arr))
                    arr.shift();
                //else Runtime Error
                this.stack.push(arr);
                break;
        }
    }
    evaluateBinaryExpression(num1, num2, instruction) {
        if (typeof num1 != "number" || typeof num2 != "number")
            return; //Runtime Error
        this.logger.info("evaluating binary expression on targets: " + num1 + " and " + num2);
        //@ts-ignore
        switch (Instructions_1.Instruction[instruction]) {
            case Instructions_1.Instruction.ADD:
                this.stack.push(num1 + num2);
                break;
            case Instructions_1.Instruction.SUB:
                this.stack.push(num1 - num2);
                break;
            case Instructions_1.Instruction.MUL:
                this.stack.push(num1 * num2);
                break;
            case Instructions_1.Instruction.DIV:
                this.stack.push(num1 / num2);
                break;
            case Instructions_1.Instruction.EQ:
                this.stack.push(num1 == num2);
                break;
            case Instructions_1.Instruction.NE:
                this.stack.push(num1 != num2);
                break;
            case Instructions_1.Instruction.LT:
                this.stack.push(num1 < num2);
                break;
            case Instructions_1.Instruction.LE:
                this.stack.push(num1 <= num2);
                break;
            case Instructions_1.Instruction.HT:
                this.stack.push(num1 > num2);
                break;
            case Instructions_1.Instruction.HE:
                this.stack.push(num1 >= num2);
                break;
        }
    }
    evaluateIf(expr, branch1, branch2) {
        if (!Array.isArray(branch1) || !Array.isArray(branch2))
            return; //Runtime Error
        this.logger.info("evaluating if with condition " + expr + " with branches: " + branch1 + " and " + branch2);
        this.dump.push(this.cloneArray(this.code));
        if (expr)
            this._code = this.cloneArray(branch1);
        else
            this._code = this.cloneArray(branch2);
    }
    evaluateLoad(num1, num2) {
        let x = this.environment.length - num1 - 1;
        let innerArr = this.environment[x];
        if (Array.isArray(innerArr))
            return innerArr[innerArr.length - num2 - 1];
        //Runtime Error
    }
    detectAction() {
        let code = this.code;
        if (code.length == 0) {
            console.log(this.stack.pop());
            return;
        }
        let tmpArr = new SECDArray_1.SECDArray();
        let tmpArr2 = new SECDArray_1.SECDArray(), tmpArr3, instruction;
        instruction = code.shift();
        //@ts-ignore
        switch (Instructions_1.Instruction[instruction]) {
            case Instructions_1.Instruction.LDC:
                tmpArr.push(code.shift());
                this.stack.push(tmpArr[0]);
                break;
            case Instructions_1.Instruction.LD:
                tmpArr.push(code.shift());
                tmpArr3 = tmpArr[0];
                tmpArr2 = this.evaluateLoad(tmpArr3[0], tmpArr3[1]);
                this.logger.info("loading value: " + tmpArr2);
                this.stack.push(tmpArr2);
                break;
            case Instructions_1.Instruction.SEL:
                this.evaluateIf(this.stack.pop(), code.shift(), code.shift());
                break;
            case Instructions_1.Instruction.JOIN:
                this._code = this.dump.pop();
                break;
            case Instructions_1.Instruction.NIL:
                //this.logger.info("loading empty list")
                this.stack.push(new SECDArray_1.SECDArray());
                break;
            case Instructions_1.Instruction.DUM:
                this.environment.push(new SECDArray_1.SECDArray());
                break;
            case Instructions_1.Instruction.CONSP:
            case Instructions_1.Instruction.CAR:
            case Instructions_1.Instruction.CDR:
                this.evaluateUnaryExpression(this.stack.pop(), instruction);
                break;
            case Instructions_1.Instruction.ADD:
            case Instructions_1.Instruction.SUB:
            case Instructions_1.Instruction.MUL:
            case Instructions_1.Instruction.DIV:
            case Instructions_1.Instruction.EQ:
            case Instructions_1.Instruction.NE:
            case Instructions_1.Instruction.LT:
            case Instructions_1.Instruction.LE:
            case Instructions_1.Instruction.HT:
            case Instructions_1.Instruction.HE:
                this.evaluateBinaryExpression(this.stack.pop(), this.stack.pop(), instruction);
                break;
            case Instructions_1.Instruction.CONS:
                tmpArr.push(this.stack.pop());
                tmpArr2 = this.stack.pop();
                tmpArr2.push(tmpArr.pop());
                this.stack.push(tmpArr2);
                break;
            case Instructions_1.Instruction.LDF:
                tmpArr.push(this.code.shift());
                tmpArr.push(this.environment);
                this.logger.info("loading function: " + tmpArr[0] /*+ " in environment: " + tmpArr[1]*/);
                this.stack.push(tmpArr);
                break;
            case Instructions_1.Instruction.AP:
                tmpArr.push(this.stack.pop());
                tmpArr.push(this.stack.pop());
                this.dump.push(this.cloneArray(this.stack));
                this.dump.push(this.cloneArray(this.code));
                this.dump.push(this.cloneArray(this.environment));
                tmpArr3 = tmpArr[0];
                this.code = this.cloneArray(tmpArr3[0]);
                this.environment = this.cloneArray(tmpArr3[1]);
                this.environment.push(tmpArr[1]);
                this.stack.length = 0;
                this.logger.info("Applying function: " + this.code + " with arguments: " + this.environment + "");
                break;
            case Instructions_1.Instruction.RAP:
                tmpArr.push(this.stack.pop());
                tmpArr.push(this.stack.pop());
                this._environment[this.environment.length - 1] = tmpArr[1];
                tmpArr.push(this.environment.pop());
                this.dump.push(this.cloneArray(this.stack));
                this.dump.push(this.cloneArray(this.code));
                this.dump.push(this.cloneArray(this.environment));
                this.environment.push(tmpArr.pop());
                tmpArr3 = tmpArr[0];
                this.code = tmpArr3[0];
                this.stack.length = 0;
                this.logger.info("Applying recursive function: " + this.code + " with arguments: " + this.environment + "");
                break;
            case Instructions_1.Instruction.RTN:
                tmpArr.push(this.stack.pop());
                this.stack = new SECDArray_1.SECDArray();
                this.environment = new SECDArray_1.SECDArray();
                this.code = new SECDArray_1.SECDArray();
                this.environment = this.environment.concat(this.dump.pop());
                this.code = this.code.concat(this.dump.pop());
                this.stack = this.stack.concat(this.dump.pop());
                this.stack.push(tmpArr[0]);
                this.logger.info("Returning from function, result: " + tmpArr[0]);
                break;
            case Instructions_1.Instruction.DEFUN:
                if (Array.isArray(this.environment[0]))
                    this.environment[0].push(this.stack.pop());
                //else Runtime Error
                break;
            default:
                console.log("error");
        }
        //this.detectAction()
    }
}
exports.Interpreter = Interpreter;
//# sourceMappingURL=Interpreter.js.map