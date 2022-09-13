import { TopNode } from "./AST/AST";
import { Interpreter } from "./interpreter/Interpreter";
import { InterpreterState } from "./interpreter/InterpreterState";
import { Parser } from "./parser/Parser";
import { SECDArray } from "./SECD/SECDArray";

let parser = new Parser();
let interpreter: Interpreter
let arr: SECDArray

let sourceCode = "(define (my-append lst x)\n" +
    "  (if (consp lst)" +
    "      (cons (car lst) (my-append (cdr lst) x))" +
    "      (cons x '())))" +
    "(my-append '() 2)"

arr = parser.parse(sourceCode)
console.log(parser.parse(sourceCode))
interpreter = new Interpreter(new InterpreterState(arr, parser.topNode as TopNode));
interpreter.run()




