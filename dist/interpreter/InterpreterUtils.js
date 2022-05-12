"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterpreterUtils = void 0;
const SECDArray_1 = require("../SECD/SECDArray");
const InterpreterErrors_1 = require("./InterpreterErrors");
class InterpreterUtils {
    /**
     * Generates random string of 1 to 16 characters beginning with symbol '!'. Other characters are upper or lower case letters, number, '_' or '-'
     * The function also guarantees, that the same string won't be returned multiple times.
     * The string "gensym" also cannot be generated.
     *
     * @param interpreter
     */
    static gensym(interpreter) {
        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
        function randomInteger(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        let res = "!";
        for (let i = 0; i <= randomInteger(0, 15); i++)
            res += characters.charAt(Math.floor(Math.random() * characters.length));
        while (interpreter.gensymVars.indexOf(res) > -1)
            res = this.gensym(interpreter);
        interpreter.gensymVars.push(res);
        return res;
    }
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
            return loaded;
        }
        throw new InterpreterErrors_1.InterpreterError("Environment is not a list of lists");
    }
}
exports.InterpreterUtils = InterpreterUtils;
//# sourceMappingURL=InterpreterUtils.js.map