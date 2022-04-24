import { SECDArray } from "../SECD/SECDArray"
import { SECDElement } from "../SECD/SECDElement"
import { InterpreterError } from "./InterpreterErrors"



export class InterpreterUtils{
    /**
     *
     * @param environment environment where we search for the variable
     * @param index1 - first index of LD instruction
     * @param index2 - second index of LD instruction
     */

    static evaluateLoad(environment: SECDArray, index1: number, index2: number): SECDElement{
        let x = environment.length() - index1 - 1
        let innerArr = environment.get(x)
        if(innerArr instanceof SECDArray) {
            let loaded = innerArr.get(innerArr.length() - index2 - 1)
            return loaded.clone()
        }
        throw new InterpreterError("Environment no a list of lists")
    }
}