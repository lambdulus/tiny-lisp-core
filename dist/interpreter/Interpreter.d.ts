import { SECDArray } from "../parser/SECDArray";
import { Logger } from "../logger/Logger";
export declare class Interpreter {
    logger: Logger;
    constructor(instructions: SECDArray);
    get stack(): SECDArray;
    set stack(value: SECDArray);
    get code(): SECDArray;
    set code(value: SECDArray);
    get dump(): SECDArray;
    set dump(value: SECDArray);
    get environment(): SECDArray;
    set environment(value: SECDArray);
    private _stack;
    private _code;
    private _dump;
    private _environment;
    private cloneArray;
    private evaluateUnaryExpression;
    private evaluateBinaryExpression;
    private evaluateIf;
    private evaluateLoad;
    detectAction(): void;
}
