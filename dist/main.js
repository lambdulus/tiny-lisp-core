"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parser_1 = require("./parser/Parser");
const Interpreter_1 = require("./interpreter/Interpreter");
const AST_1 = require("./AST/AST");
let parser = new Parser_1.Parser();
function run(interpreter) {
    let top = interpreter.topNode;
    while (!(top.node instanceof AST_1.ValueNode || top.node instanceof AST_1.EndNode)) {
        if (interpreter.code.empty())
            break;
        interpreter.detectAction();
        top = interpreter.topNode;
        /*let str = top.print()
        console.log(str)
    */ }
}
let interpreter;
let arr;
/*
console.log("(if #f 0 1)");
arr = parser.parse("(if #f 0 1)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)



console.log("(- 10 ( + 2 ( * 4 5)))");
arr = parser.parse("(- 10 ( + 2( * 4 5)))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)

console.log("(if 0 (+ 2 3) (+ 4 5))");
arr = parser.parse("(if 0 (+ 2 3) (+ 4 5))")
interpreter = new Interpreter(arr, parser.topNode as TopNode)
run(interpreter)

console.log("(* (if 0 (+ 2 3) (+ 4 5)) 10)");
arr = parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)

console.log("(* (if 0 (if 0 (+ 2 3) (+ 4 5)) (if 0 (+ 6 37) (+ 8 9))) 10)");
arr = parser.parse("(* (if 0 (if 0 (+ 2 3) (+ 4 5)) (if 0 (+ 6 37) (+ 8 9))) 10)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)
*/
console.log(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
arr = parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
run(interpreter);
/*
console.log(parser.parse("(+ 1 ((lambda (x y z) (+ z ((lambda (a b) (+ ((lambda (f) (- f 1)) a) b)) x y) )) 10 20 30))"));
arr = parser.parse("(+ 1 ((lambda (x y z) (+ z ((lambda (a b) (+ ((lambda (f) (- f 1)) a) b)) x y) )) 10 20 30))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)

console.log(parser.parse("(letrec((fact) " +
                                    "((lambda(n)" +
                                        "(if (= n 0)" +
                                            "1" +
                                            "(* n (fact (- n 1)))))))" +
                                "(fact 2))"));

arr = parser.parse("(letrec((fact) " +
    "((lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 2))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)

console.log(parser.parse("\"a\""))
console.log(parser.parse("'(#t \"ff\" 1 2 3 \"ff\")"));
interpreter = new Interpreter(parser.parse("'(1 2 3)"));
run(interpreter)
console.log(parser.parse("(define cadr(lst)" +
                                        "(car (cdr lst)))" +
                                "(define cdadr(lst)" +
                                        "(cdr (cadr lst)))" +
                                "(cdadr '(1 (2 1) 3))"));
arr = parser.parse(
    "(define cadr(lst)" +
    "(car (cdr lst)))" +
    "(define cdadr(lst)" +
    "(cdr (cadr lst)))" +
    "(cdadr '(1 (2 1) 3))")

interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)
*/ 
//# sourceMappingURL=main.js.map