import { StringNode } from "../AST/AST";
import { SECDArray } from "../SECD/SECDArray"
import { SECDElement } from "../SECD/SECDElement"
import { SECDValue } from "../SECD/SECDValue";
import { Interpreter } from "./Interpreter";
import { InterpreterError } from "./InterpreterErrors"



export class InterpreterUtils{

    /**
     * Generates random string of 1 to 16 characters beginning with symbol '!'. Other characters are upper or lower case letters, number, '_' or '-'
     * The function also guarantees, that the same string won't be returned multiple times.
     * The string "gensym" also cannot be generated.
     * 
     * @param interpreter
     */

    static gensym(interpreter: Interpreter): string{
        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
        function randomInteger(min: number, max: number) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        let res = "!"
        for(let i = 0; i <= randomInteger(0, 15); i ++)
            res += characters.charAt(Math.floor(Math.random() * characters.length))
        while(interpreter.gensymVars.indexOf(res) > -1)
            res = this.gensym(interpreter)
        interpreter.gensymVars.push(res)
        return res
    }

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
            return loaded
        }
        throw new InterpreterError("Environment is not a list of lists")
    }
}