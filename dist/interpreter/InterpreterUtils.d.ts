import { SECDArray } from "../SECD/SECDArray";
import { SECDElement } from "../SECD/SECDElement";
import { Interpreter } from "./Interpreter";
export declare class InterpreterUtils {
    /**
     * Generates random string of 1 to 16 characters beginning with symbol '!'. Other characters are upper or lower case letters, number, '_' or '-'
     * The function also guarantees, that the same string won't be returned multiple times.
     * The string "gensym" also cannot be generated.
     *
     * @param interpreter
     */
    static gensym(interpreter: Interpreter): string;
    /**
     *
     * @param environment environment where we search for the variable
     * @param index1 - first index of LD instruction
     * @param index2 - second index of LD instruction
     */
    static evaluateLoad(environment: SECDArray, index1: number, index2: number): SECDElement;
}
