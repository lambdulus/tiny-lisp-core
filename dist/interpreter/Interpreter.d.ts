import { SECDArray } from "../SECD/SECDArray";
import { Instruction } from "../SECD/instructions/Instruction";
import { TopNode } from "../AST/AST";
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
    /**
     * Converts boolean value to number
     * @param bool
     * @private
     */
    private static boolToInt;
    /**
     * Evaluates unary operator
     * @param val                   - argument of the operator
     * @param instructionShortcut   - shortcut of the operator
     * @param instructionNode       - node of the unary expression
     * @private
     */
    private evaluateUnaryOperator;
    /**
     * Evaluates binary operator
     * @param val1                  - first argument of operator
     * @param val2                  - secod argument of operator
     * @param instructionShortcut   - shortcut of the instruction
     * @param instructionNode       - node of the binary instruction
     * @private
     */
    private evaluateBinaryOperator;
    /**
     * Evaluate SEL instruction
     * @param condElement - condition
     * @param branch1     - first branch of if
     * @param branch2     - second branch of if
     * @param ifNode      - node of if
     * @private
     */
    private evaluateSEL;
    /**
     * Performs interpreter step
     */
    step(): void;
    /**
     * Runs interpreter until code register is empty
     */
    run(): void;
    /**
     *
     * @param instructionShortcut - instruction to be executed
     * @param node  - node of the instruction
     * @private
     */
    private applyInstruction;
}
