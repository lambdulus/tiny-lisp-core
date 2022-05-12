import { TopNode } from "../AST/AST";
import { SECDArray } from "../SECD/SECDArray";
/**
 * Encapsulates registers and AST
 */
export declare class InterpreterState {
    private _stack;
    private _code;
    private _dump;
    private _environment;
    private readonly _topNode;
    constructor(instructions: SECDArray, topNode: TopNode, environment?: SECDArray);
    get topNode(): TopNode;
    get stack(): SECDArray;
    set stack(value: SECDArray);
    get code(): SECDArray;
    set code(value: SECDArray);
    get dump(): SECDArray;
    set dump(value: SECDArray);
    get environment(): SECDArray;
    set environment(value: SECDArray);
}
