"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECDArray = exports.Interpreter = exports.Parser = void 0;
const Parser_1 = require("./parser/Parser");
Object.defineProperty(exports, "Parser", { enumerable: true, get: function () { return Parser_1.Parser; } });
const Interpreter_1 = require("./interpreter/Interpreter");
Object.defineProperty(exports, "Interpreter", { enumerable: true, get: function () { return Interpreter_1.Interpreter; } });
const SECDArray_1 = require("./parser/SECDArray");
Object.defineProperty(exports, "SECDArray", { enumerable: true, get: function () { return SECDArray_1.SECDArray; } });
let parser = new Parser_1.Parser();
console.log(parser.parse("(- 10 ( + 2 ( * 4 5)))"));
let interpreter = new Interpreter_1.Interpreter(parser.parse("(- 10 ( + 2 ( * 4 5)))"));
interpreter.detectAction();
console.log(parser.parse("(if 0 (+ 2 3) (+ 4 5))"));
interpreter = new Interpreter_1.Interpreter(parser.parse("(if 0 (+ 2 3) (+ 4 5))"));
interpreter.detectAction();
console.log(parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)"));
interpreter = new Interpreter_1.Interpreter(parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)"));
interpreter.detectAction();
console.log(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
interpreter = new Interpreter_1.Interpreter(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
interpreter.detectAction();
console.log(parser.parse("(letrec((fact) " +
    "((lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 2))"));
interpreter = new Interpreter_1.Interpreter(parser.parse("(letrec((fact) " +
    "((lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 2))"));
interpreter.detectAction();
console.log(parser.parse("'(1 2 3)"));
/*
console.log(parser.parse("(define cadr(lst)" +
                                        "(car (cdr lst)))" +
                                "(define cdadr(lst)" +
                                        "(cdr (cadr lst)))" +
                                "(cdadr '(1 2 3))"));
let interpreter = new Interpreter(parser.parse(
                            "(define cadr(lst)" +
                                        "(car (cdr lst)))" +
                                "(define cdadr(lst)" +
                                        "(cdr (cadr lst)))" +
                                "(cdadr '(1 2 3))"));
interpreter.detectAction();*/
//# sourceMappingURL=main.js.map