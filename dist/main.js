"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parser_1 = require("./parser/Parser");
const Interpreter_1 = require("./interpreter/Interpreter");
let parser = new Parser_1.Parser();
let interpreter;
let arr;
/*



console.log(parser.parse("(letrec((fact " +
    "(lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 4))"));

arr = parser.parse("(letrec((fact " +
    "(lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 4))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()



console.log("(- 10 ( + 2 ( * 4 5)))");
arr = parser.parse("(- 10 ( + 2( * 4 5)))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()


console.log(parser.parse("(let  ((x 1)(y 4))" +
    "    (+ x y))"));
arr = parser.parse("(let  ((x 1)(y 4))" +
    "    (+ x y))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()


arr = parser.parse("`(2 2 (+ 2 2))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()


console.log(parser.parse("`(1 ,(+ 1 2) 3)"));
arr = parser.parse("`(1 ,(+ 1 2) 3)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()


console.log(parser.parse("(define inc(x) (+ x 1))" +
    "(inc (+ 2 2))"));
arr = parser.parse("(define inc(x) (+ x 1))" +
    "(inc (+ 2 2))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()


console.log(parser.parse("(define-macro inc(x) `(+ ,x 1))" +
                        "(inc (+ 2 2))"));
arr = parser.parse("(define-macro inc(x) `(+ ,x 1))" +
                    "(inc (+ 2 2))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()

console.log(parser.parse("(define my-while (i ub foo)"+
"(if (= i ub)" +
"null" +
"(begin" +
"(foo)" +
"(my-while (+ i 1) ub foo))))"));

arr = parser.parse("(define my-while (i ub foo)"+
    "(if (= i ub)" +
    "null" +
    "(begin" +
    "(foo)" +
    "(my-while (+ i 1) ub foo))))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()



arr = parser.parse("((lambda (x) x) (+ 1 2))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()






console.log(parser.parse("(define cadr(lst)" +
    "   (car (cdr lst)))" +
    "   (define-macro my-let (capture-pair body)" +
    "   `(" +
    "   (lambda (,(car capture-pair)) ,body)" +
    "   ,(cadr capture-pair)" +
    "   )" +
    "   )" +
    "(my-let (x (+ 1 2)) x)"));
arr = parser.parse("(define cadr(lst)" +
    "   (car (cdr lst)))" +
    "   (define-macro my-let (capture-pair body)" +
    "   `(" +
    "   (lambda (,(car capture-pair)) ,body)" +
    "   ,(cadr capture-pair)" +
    "   )" +
    "   )" +
    "(my-let (x (+ 1 2)) x)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()


console.log(parser.parse("(define-macro if-consp (val tb fb)" +
    "`(if (consp ,val)" +
    "       ,tb" +
    "       ,fb))" +
    "(+ (if-consp 4 (+ 1 2) (+ 2 3)) 5)"));
arr = parser.parse("(define-macro if-consp (val tb fb)" +
    "`(if (consp ,val)" +
    ",tb" +
    ",fb))" +
    "(+ (if-consp 4 (+ 1 2) (+ 2 3)) 5)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()



console.log(parser.parse("(begin (+ 1 2) (+ 3 4) (+ 5 6))"));
arr = parser.parse("(begin (+ 1 2) (+ 3 4) (+ 5 6))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()



console.log("(if #f 0 1)");
arr = parser.parse("(if #f 0 1)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()


console.log("(if 0 (+ 2 3) (+ 4 5))");
arr = parser.parse("(if 0 (+ 2 3) (+ 4 5))")
interpreter = new Interpreter(arr, parser.topNode as TopNode)
interpreter.run()

console.log("(* (if 0 (+ 2 3) (+ 4 5)) 10)");
arr = parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()

console.log("(* (if 0 (if 0 (+ 2 3) (+ 4 5)) (if 0 (+ 6 37) (+ 8 9))) 10)");
arr = parser.parse("(* (if 0 (if 0 (+ 2 3) (+ 4 5)) (if 0 (+ 6 37) (+ 8 9))) 10)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()

console.log(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
arr = parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()

console.log(parser.parse("(+ 1 ((lambda (x y z) (+ z ((lambda (a b) (+ ((lambda (f) (- f 1))) b)) x y) )) 10 20 30))"));
arr = parser.parse("(+ 1 ((lambda (x y z) (+ z ((lambda (a b) (+ ((lambda (f) (- f 1))) b)) x y) )) 10 20 30))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()

console.log(parser.parse("(letrec((fibFact)" +
    "((lambda(n)" +
    "(if (<= n 1)" +
    "(letrec((fact)" +
    "((lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 2))" +
    "(+ (fibFact (- n 2)) (fibFact (- n 1)))))))" +
    "(fibFact 2))"))

arr = parser.parse("(letrec((fibFact)" +
"((lambda(n)" +
"(if (<= n 1)" +
"(letrec((fact)" +
"((lambda(n)" +
"(if (= n 0)" +
"1" +
"(* n (fact (- n 1)))))))" +
"(fact 2))" +
"(+ (fibFact (- n 2)) (fibFact (- n 1)))))))" +
"(fibFact 2))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()

*/
console.log(parser.parse("(letrec((fib"
    + "(lambda(n)"
    + "(if (<= n 1)"
    + "1"
    + "(+ (fib (- n 2)) (fib (- n 1)))))))"
    + "(fib 5))"));
arr = parser.parse("(letrec((fib"
    + "(lambda(n)"
    + "(if (<= n 1)"
    + "1"
    + "(+ (fib (- n 2)) (fib (- n 1)))))))"
    + "(fib 5))");
interpreter = new Interpreter_1.Interpreter(arr, parser.topNode);
interpreter.run();
/*

//console.log(parser.parse("\"a\""))
//console.log(parser.parse("'(#t \"ff\" 1 2 3 \"ff\")"));
//interpreter = new Interpreter(parser.parse("'(1 2 3)"));
//interpreter.run()

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
interpreter.run()
*/ 
//# sourceMappingURL=main.js.map