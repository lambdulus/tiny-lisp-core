
import {Parser} from "./src/parser/Parser";
import {Interpreter} from "./src/interpreter/Interpreter";
import {SECDArray} from "./src/utility/SECD/SECDArray"
import {SECDVisitor} from "./src/utility/visitors/SECDVisitor";
import {SECDValue} from "./src/utility/SECD/SECDValue";
import {ColourType} from "./src/utility/SECD/ColourType";
import {
    BinaryExprNode, Node,
    CompositeNode, EndNode,
    FuncNode,
    IfNode,
    LambdaNode,
    TopNode,
    UnaryExprNode,
    ValueNode,
    VarNode, InnerNode, PrintCall
} from "./src/AST/AST";
import {LispASTVisitor} from "./src/AST/LispASTVisitor";
import {InstructionShortcut} from "./src/utility/instructions/InstructionShortcut";

export {Parser, Interpreter, SECDArray, SECDVisitor, SECDValue, ColourType, BinaryExprNode, Node,
    CompositeNode, EndNode, FuncNode, IfNode, LambdaNode, TopNode,
    UnaryExprNode, ValueNode, InnerNode, VarNode, LispASTVisitor, PrintCall, InstructionShortcut}

let parser = new Parser();


function run(interpreter: Interpreter): void{
    let top = <TopNode> interpreter.topNode
    while(!(top.node instanceof ValueNode || top.node instanceof EndNode)){
        interpreter.detectAction()
        top = <TopNode> interpreter.topNode
        let str = top.print(PrintCall.Static)
        let str2 = top.print(PrintCall.Dynamic)
        console.log(str)
        console.log(str2)
    }
}
/*
console.log("(- 10 ( + 2 ( * 4 5)))");
let interpreter = new Interpreter(parser.parse("(- 10 ( + 2 ( * 4 5)))"));
run(interpreter)

console.log("(if 0 (+ 2 3) (+ 4 5))");
let interpreter = new Interpreter(parser.parse("(if 0 (+ 2 3) (+ 4 5))"));
run(interpreter)

console.log("(* (if 0 (+ 2 3) (+ 4 5)) 10)");
let interpreter = new Interpreter(parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)"));
run(interpreter)
*/
console.log(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
let interpreter = new Interpreter(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
run(interpreter)
/*
console.log(parser.parse("(letrec((fact) " +
                                    "((lambda(n)" +
                                        "(if (= n 0)" +
                                            "1" +
                                            "(* n (fact (- n 1)))))))" +
                                "(fact 2))"));
let interpreter = new Interpreter(parser.parse("(letrec((fact) " +
                                                            "((lambda(n)" +
                                                                "(if (= n 0)" +
                                                                    "1" +
                                                                    "(* n (fact (- n 1)))))))" +
                                                        "(fact 2))"));
interpreter.detectAction();*/
/*
console.log(parser.parse("'(1 2 3)"));

console.log(parser.parse("(define cadr(lst)" +
                                        "(car (cdr lst)))" +
                                "(define cdadr(lst)" +
                                        "(cdr (cadr lst)))" +
                                "(cdadr '(1 2 3))"));
interpreter = new Interpreter(parser.parse(
                            "(define cadr(lst)" +
                                        "(car (cdr lst)))" +
                                "(define cdadr(lst)" +
                                        "(cdr (cadr lst)))" +
                                "(cdadr '(1 2 3))"));
interpreter.detectAction();*/
