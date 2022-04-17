"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SECDArray_1 = require("../utility/SECD/SECDArray");
class InterpreterState {
    constructor(instructions, topNode, environment) {
        this._code = instructions;
        this._stack = new SECDArray_1.SECDArray();
        this._dump = new SECDArray_1.SECDArray();
        if (environment)
            this._environment = environment;
        else {
            this._environment = new SECDArray_1.SECDArray();
            this._environment.push(new SECDArray_1.SECDArray());
        }
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
}
exports.InterpreterState = InterpreterState;
//# sourceMappingURL=InterpreterState.js.map