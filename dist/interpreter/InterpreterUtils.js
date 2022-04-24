"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SECDArray_1 = require("../SECD/SECDArray");
const InterpreterErrors_1 = require("./InterpreterErrors");
class InterpreterUtils {
    /**
     *
     * @param environment environment where we search for the variable
     * @param index1 - first index of LD instruction
     * @param index2 - second index of LD instruction
     */
    static evaluateLoad(environment, index1, index2) {
        let x = environment.length() - index1 - 1;
        let innerArr = environment.get(x);
        if (innerArr instanceof SECDArray_1.SECDArray) {
            let loaded = innerArr.get(innerArr.length() - index2 - 1);
            return loaded.clone();
        }
        throw new InterpreterErrors_1.InterpreterError("Environment no a list of lists");
    }
}
exports.InterpreterUtils = InterpreterUtils;
//# sourceMappingURL=InterpreterUtils.js.map