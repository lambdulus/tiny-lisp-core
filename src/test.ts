import {ReduceNode, TopNode, ValueNode } from "../src"
import { Interpreter } from "../src/interpreter/Interpreter"
import { Parser } from "../src/parser/Parser"
import { SECDArray } from "../src/SECD/SECDArray"
import { SECDValue } from "../src/SECD/SECDValue"


function testValue(x: number, interpreter: Interpreter){
    let result = interpreter.state.stack.get(0)
    if(result instanceof SECDValue) {
        let y = (result as SECDValue).constant as unknown as number
        assert(x, y)
        console.log("Test successful")
    }
    else
        throw new Error()
}


function testArr(arr: number[], interpreter: Interpreter){
    let result = interpreter.state.stack.get(0)
    if(result instanceof SECDArray) {
        for(let i = 0; i < result.length(); i ++){
            assert((result.get(i) as SECDValue).constant as unknown as number, arr[i])
        }
    }
}


function assert(num1: number, num2: number){
    if(num1 != num2) {
        console.log("NUMBERS: ", num1, num2)
        throw new Error()
    }
}



function run(sourceCode: string, res: any){
    console.log("Starting test on: \n", sourceCode)
    arr = parser.parse(sourceCode)
    interpreter = new Interpreter(arr, parser.topNode as TopNode);
    interpreter.run()
    if(Array.isArray(res)){
        testArr(res, interpreter)
    }
    else {
        testValue(res, interpreter)
    }
}






let parser = new Parser();
let interpreter: Interpreter
let arr: SECDArray


run("(- 10 ( + 2( * 4 5)))", -12)

run("(+ 1 ((lambda (x y) (+ x y)) 10 20))", 31)

run("(let  ((x 1)(y 4))" +
    "    (+ x y))", 5)

run("(begin (+ 1 2) (+ 3 4) (+ 5 6))", 11)

run("(if #f 0 1)", 1)

run("(cons 0 1)", Array.of(0, 1))

run("(cons 0 '(1 2 3 4))", Array.of(0, 1, 2, 3, 4))

run("(if 0 (+ 2 3) (+ 4 5))", 9)

run("(* (if 0 (+ 2 3) (+ 4 5)) 10)", 90)


run("(letrec((fib"
    + "(lambda(n)"
    + "(if (<= n 1)"
    + "1"
    + "(+ (fib (- n 2)) (fib (- n 1)))))))"
    + "(fib 5))", 8)

run("(letrec((fact " +
    "(lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 6))", 720)

run("`(1 ,(+ 1 2) 3)", Array.of(1, 3, 3))


run("(define (cadr lst)" +
        "   (car (cdr lst)))" +
    "   (define-macro (my-let capture-pair body)" +
        "   `(" +
            "   (lambda (,(car capture-pair)) ,body)" +
                "   ,(cadr capture-pair)" +
            "   )" +
        "   )" +
    "(my-let (x (+ 1 2)) x)", 3)



run("(define (cadr lst)" +
        "(car (cdr lst)))" +
    "(define (cdadr lst)" +
        "(cdr (cadr lst)))" +
    "(cdadr '(1 (2 3) 4))", Array.of(3))


run("(define-macro (if-consp val tb fb)" +
    "`(if (consp ,val)" +
    ",tb" +
    ",fb))" +
    "(+ (if-consp 4 (+ 1 2) (+ 2 3)) 5)", 10)


run("(define-macro (cmp a b if-lt if-eq if-ht)" +
        "(let ((tmp1 (gensym))" +
            "(tmp2 (gensym)))" +
        "`(let (" +
            "(,tmp1 ,a)" +
            "(,tmp2 ,b)" +
            ")" +
        "(if (< ,tmp1 ,tmp2)" +
            ",if-lt" +
            "(if (= ,tmp1 ,tmp2)" +
                ",if-eq" +
                ",if-ht)))))" +

    "(define (foo a b lhs rhs)" +
        "(cmp a b" +
            "(+ lhs rhs)" +
            "(- lhs rhs)" +
            "(* lhs rhs)))" +
    "(foo 4 6 100 255)", 355)