import {Parser} from "./parser/Parser";
import {Interpreter} from "./interpreter/Interpreter";
import {SECDArray} from "./utility/SECD/SECDArray"
import {SECDVisitor} from "./utility/visitors/SECDVisitor";
import {SECDValue} from "./utility/SECD/SECDValue";
import {SECDElement} from "./utility/SECD/SECDElement";
import {SECDElementType} from "./utility/SECD/SECDElementType"
import {ColourType} from "./utility/SECD/ColourType";
import {
    BinaryExprNode, Node, CallNode,
    CompositeNode, DefineNode, EndNode,
    FuncNode,
    IfNode, LetNode,
    LambdaNode, OperatorNode,
    TopNode,
    UnaryExprNode, MainNode,
    ValueNode, StringNode,
    VarNode, InnerNode, Position
} from "./AST/AST";
import {LispASTVisitor} from "./AST/LispASTVisitor";
import {InstructionShortcut} from "./utility/instructions/InstructionShortcut";
import {Instruction} from "./utility/instructions/Instruction";


export {Parser, Interpreter, SECDArray, SECDVisitor, SECDValue, SECDElement, SECDElementType, ColourType, BinaryExprNode, Node,
    CallNode, CompositeNode, DefineNode, EndNode, FuncNode, IfNode, LambdaNode, LetNode, StringNode, TopNode,
    UnaryExprNode, ValueNode, MainNode, OperatorNode, InnerNode, VarNode, LispASTVisitor,
    Instruction, InstructionShortcut, Position}
let parser = new Parser();


function run(interpreter: Interpreter): void{
    let top = <TopNode> interpreter.topNode
    while(!(top.node instanceof ValueNode || top.node instanceof EndNode)){
        if(interpreter.code.empty())
            break
        interpreter.detectAction()
        top = <TopNode> interpreter.topNode
        let str = top.print()
        console.log(str)
    }
}
let interpreter: Interpreter
let arr: SECDArray
/*
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

console.log(parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))"));
arr = parser.parse("(+ 1 ((lambda (x y) (+ x y)) 10 20))")
interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)

console.log(parser.parse("(+ 1 ((lambda (x y z) (+ z ((lambda (a b) (+ a b)) x y) )) 10 20 30))"));
arr = parser.parse("(+ 1 ((lambda (x y z) (+ z ((lambda (a b) (+ a b)) x y) )) 10 20 30))")
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
                                "(cdadr '(1 2 3))"));
arr = parser.parse(
    "(define cadr(lst)" +
    "(car (cdr lst)))" +
    "(define cdadr(lst)" +
    "(cdr (cadr lst)))" +
    "(cdadr '(1 2 3))")

interpreter = new Interpreter(arr, parser.topNode as TopNode);
run(interpreter)
*/