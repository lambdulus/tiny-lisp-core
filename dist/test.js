"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Interpreter_1 = require("../src/interpreter/Interpreter");
const Parser_1 = require("../src/parser/Parser");
const SECDArray_1 = require("../src/utility/SECD/SECDArray");
const SECDValue_1 = require("../src/utility/SECD/SECDValue");
function testValue(x, interpreter) {
    let result = interpreter.state.stack.get(0);
    if (result instanceof SECDValue_1.SECDValue) {
        let y = result.constant;
        console.log(result, y);
        assert(x, y);
        console.log("Test successful");
    }
    else
        throw new Error();
}
function testArr(arr, interpreter) {
    let result = interpreter.state.stack.get(0);
    if (result instanceof SECDArray_1.SECDArray) {
        for (let i = 0; i < result.length(); i++) {
            assert(result.get(i).constant, arr[i]);
        }
    }
}
function assert(num1, num2) {
    if (num1 != num2) {
        console.log(num1, num2);
        throw new Error();
    }
}
let parser = new Parser_1.Parser();
let interpreter;
let arr;
arr = parser.parse("(- 10 ( + 2( * 4 5)))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(-12, interpreter);
arr = parser.parse("(let  ((x 1)(y 4))" +
    "    (+ x y))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(5, interpreter);
arr = parser.parse("(begin (+ 1 2) (+ 3 4) (+ 5 6))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(11, interpreter);
arr = parser.parse("(if #f 0 1)");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(1, interpreter);
arr = parser.parse("(if 0 (+ 2 3) (+ 4 5))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(9, interpreter);
arr = parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(90, interpreter);
arr = parser.parse("(letrec((fib"
    + "(lambda(n)"
    + "(if (<= n 1)"
    + "1"
    + "(+ (fib (- n 2)) (fib (- n 1)))))))"
    + "(fib 5))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(8, interpreter);
arr = parser.parse("(letrec((fact " +
    "(lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 6))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testValue(720, interpreter);
arr = parser.parse("`(1 ,(+ 1 2) 3)");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
testArr(Array(1, 3, 3), interpreter);
//# sourceMappingURL=test.js.map