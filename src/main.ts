
import {Parser} from "./src/parser/Parser";
import {Interpreter} from "./src/interpreter/Interpreter";
import {SECDArray} from "./src/utility/SECD/SECDArray"
import {SECDVisitor} from "./src/utility/visitors/SECDVisitor";
import {SECDValue} from "./src/utility/SECD/SECDValue";
import {SECDElement} from "./src/utility/SECD/SECDElement";
import {ColourType} from "./src/utility/SECD/ColourType";
import {
    BinaryExprNode, Node,
    CompositeNode, DefineNode, EndNode,
    FuncNode,
    IfNode,
    LambdaNode, OperatorNode,
    TopNode,
    UnaryExprNode, MainNode,
    ValueNode, StringNode,
    VarNode, InnerNode, Position
} from "./src/AST/AST";
import {LispASTVisitor} from "./src/AST/LispASTVisitor";
import {InstructionShortcut} from "./src/utility/instructions/InstructionShortcut";
import {Instruction} from "./src/utility/instructions/Instruction";

export {Parser, Interpreter, SECDArray, SECDVisitor, SECDValue, SECDElement, ColourType, BinaryExprNode, Node,
    CompositeNode, DefineNode, EndNode, FuncNode, IfNode, LambdaNode, StringNode, TopNode,
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
/*
console.log("(- 10 ( + 2 ( * 4 5)))");
let interpreter = new Interpreter(parser.parse("(- 10 ( + 2( * 4 5)))"));
run(interpreter)

console.log("(if 0 (+ 2 3) (+ 4 5))");
let interpreter = new Interpreter(parser.parse("(if 0 (+ 2 3) (+ 4 5))"));
run(interpreter)

console.log("(* (if 0 (+ 2 3) (+ 4 5)) 10)");
interpreter = new Interpreter(parser.parse("(* (if 0 (+ 2 3) (+ 4 5)) 10)"));
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
interpreter = new Interpreter(parser.parse("(letrec((fact) " +
                                                            "((lambda(n)" +
                                                                "(if (= n 0)" +
                                                                    "1" +
                                                                    "(* n (fact (- n 1)))))))" +
                                                        "(fact 2))"));
interpreter.detectAction();
console.log(parser.parse("\"a\""))
console.log(parser.parse("'(#t \"ff\" 1 2 3 \"ff\")"));
interpreter = new Interpreter(parser.parse("'(1 2 3)"));
run(interpreter)

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
run(interpreter)
*/