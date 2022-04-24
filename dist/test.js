"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Interpreter_1 = require("../src/interpreter/Interpreter");
const Parser_1 = require("../src/parser/Parser");
const SECDArray_1 = require("../src/SECD/SECDArray");
const SECDValue_1 = require("../src/SECD/SECDValue");
function testValue(x, interpreter) {
    let result = interpreter.state.stack.get(0);
    if (result instanceof SECDValue_1.SECDValue) {
        let y = result.constant;
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
        console.log("NUMBERS: ", num1, num2);
        throw new Error();
    }
}
function run(sourceCode, res) {
    console.log("Starting test on: \n", sourceCode);
    arr = parser.parse(sourceCode);
    interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
    interpreter.run();
    if (Array.isArray(res)) {
        testArr(res, interpreter);
    }
    else {
        testValue(res, interpreter);
    }
}
let parser = new Parser_1.Parser();
let interpreter;
let arr;
run("(- 10 ( + 2( * 4 5)))", -12);
run("(let  ((x 1)(y 4))" +
    "    (+ x y))", 5);
run("(begin (+ 1 2) (+ 3 4) (+ 5 6))", 11);
run("(if #f 0 1)", 1);
run("(cons 0 1)", Array(0, 1));
run("(cons 0 '(1 2 3 4))", Array(0, 1, 2, 3, 4));
run("(if 0 (+ 2 3) (+ 4 5))", 9);
run("(* (if 0 (+ 2 3) (+ 4 5)) 10)", 90);
run("(letrec((fib"
    + "(lambda(n)"
    + "(if (<= n 1)"
    + "1"
    + "(+ (fib (- n 2)) (fib (- n 1)))))))"
    + "(fib 5))", 8);
run("(letrec((fact " +
    "(lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 6))", 720);
run("`(1 ,(+ 1 2) 3)", Array(1, 3, 3));
run("(define (cadr lst)" +
    "   (car (cdr lst)))" +
    "   (define-macro (my-let capture-pair body)" +
    "   `(" +
    "   (lambda (,(car capture-pair)) ,body)" +
    "   ,(cadr capture-pair)" +
    "   )" +
    "   )" +
    "(my-let (x (+ 1 2)) x)", 3);
/*
run("(define (cadr lst)" +
        "(car (cdr lst)))" +
    "(define (cdadr lst)" +
        "(cdr (cadr lst)))" +
    "(cdadr '(1 (2 1) 3))", Array(1))

*/ 
//# sourceMappingURL=test.js.map