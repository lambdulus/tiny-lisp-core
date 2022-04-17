import {ReduceNode, TopNode, ValueNode } from "../src"
import { Interpreter } from "../src/interpreter/Interpreter"
import { Parser } from "../src/parser/Parser"
import { SECDArray } from "../src/utility/SECD/SECDArray"
import { SECDValue } from "../src/utility/SECD/SECDValue"


function testValue(x: number, interpreter: Interpreter){
    let result = interpreter.state.stack.get(0)
    if(result instanceof SECDValue) {
        let y = (result as SECDValue).constant as unknown as number
        console.log(result, y)
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
        console.log(num1, num2)
        throw new Error()
    }
}







let parser = new Parser();
let interpreter: Interpreter
let arr: SECDArray


arr = parser.parse("(- 10 ( + 2( * 4 5)))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testValue(-12, interpreter)

arr = parser.parse("(let  ((x 1)(y 4))" +
    "    (+ x y))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testValue(5, interpreter)


arr = parser.parse("(begin (+ 1 2) (+ 3 4) (+ 5 6))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testValue(11, interpreter)


arr = parser.parse("(if #f 0 1)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testValue(1, interpreter)

arr = parser.parse("(if 0 (+ 2 3) (+ 4 5))")
interpreter = new Interpreter(arr, parser.topNode as TopNode)
interpreter.run()
testValue(9, interpreter)


arr = parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testValue(90, interpreter)



arr = parser.parse("(letrec((fib"
    + "(lambda(n)"
    + "(if (<= n 1)"
    + "1"
    + "(+ (fib (- n 2)) (fib (- n 1)))))))"
    + "(fib 5))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testValue(8, interpreter)


arr = parser.parse("(letrec((fact " +
    "(lambda(n)" +
    "(if (= n 0)" +
    "1" +
    "(* n (fact (- n 1)))))))" +
    "(fact 6))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testValue(720, interpreter)


arr = parser.parse("`(1 ,(+ 1 2) 3)")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
interpreter.run()
testArr(Array(1, 3, 3), interpreter)
