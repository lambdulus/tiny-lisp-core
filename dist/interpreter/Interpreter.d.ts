import { SECDArray } from "../utility/SECD/SECDArray";
import { Instruction } from "../utility/instructions/Instruction";
import { InnerNode, TopNode } from "../AST/AST";
import { SECDElement } from "../utility/SECD/SECDElement";
import { InterpreterState } from "./InterpreterState";
export declare class Interpreter {
    get state(): InterpreterState;
    set lastInstruction(value: Instruction);
    get lastInstruction(): Instruction;
    private _lastInstruction;
    private lastInstructionNode;
    private logger;
    finished: boolean;
    private _state;
    constructor(instructions: SECDArray, topNode: TopNode, environment?: SECDArray);
    protected push(arr: SECDArray, val: string | number | boolean | SECDArray, node?: InnerNode): number;
    private cloneArray;
    private evaluateUnaryExpression;
    /**
     * Converts boolean valu to number one
     * @param bool
     * @private
     */
    private static boolToInt;
    /**
     * Computes result of operation on 2 SECDElements and pushes result on stack
     * @param val1
     * @param val2
     * @param instruction
     * @private
     */
    private evaluateBinaryExpression;
    private evaluateIf;
    static evaluateLoad(environment: SECDArray, num1: number, num2: number): SECDElement;
    step(): void;
    run(): void;
    private applyInstruction;
}
