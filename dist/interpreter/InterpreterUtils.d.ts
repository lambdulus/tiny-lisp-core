import { SECDArray } from "../SECD/SECDArray";
import { SECDElement } from "../SECD/SECDElement";
export declare class InterpreterUtils {
    /**
     *
     * @param environment environment where we search for the variable
     * @param index1 - first index of LD instruction
     * @param index2 - second index of LD instruction
     */
    static evaluateLoad(environment: SECDArray, index1: number, index2: number): SECDElement;
}
