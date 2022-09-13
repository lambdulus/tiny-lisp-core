import { TopNode } from "../AST/AST"
import { SECDArray } from "../SECD/SECDArray"


/**
 * Encapsulates registers and AST
 */

export class InterpreterState{

    private _stack: SECDArray
    private _code: SECDArray
    private _dump: SECDArray
    private _environment: SECDArray
    private readonly _topNode: TopNode
    
    constructor(instructions: SECDArray, topNode: TopNode, environment?: SECDArray) {
        this._code = instructions.reverse()
        this._stack = new SECDArray()
        this._dump = new SECDArray()
        if (environment)
            this._environment = environment
        else {
            this._environment = new SECDArray()
            this._environment.push(new SECDArray())
        }
        this._topNode = topNode
    }

    get topNode(): TopNode {
        return this._topNode;
    }

    get stack(): SECDArray {
        return this._stack
    }

    set stack(value: SECDArray) {
        this._stack = value
    }

    get code(): SECDArray {
        return this._code
    }

    set code(value: SECDArray) {
        this._code = value
    }

    get dump(): SECDArray {
        return this._dump
    }

    set dump(value: SECDArray) {
        this._dump = value
    }

    get environment(): SECDArray {
        return this._environment
    }

    set environment(value: SECDArray) {
        this._environment = value
    }
}