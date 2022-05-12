import {SECDValue} from "./SECDValue"
import {InnerNode, Node, OperatorNode, StringNode, ValueNode} from "../AST/AST"
import {ColourType} from "./ColourType"
import {SECDConstant} from "./SECDConstant"
import {SECDElement} from "./SECDElement"
import {SECDElementType} from "./SECDElementType";
import { InterpreterError } from "..//interpreter/InterpreterErrors"

export enum PrintedState{
    Not,
    Once,
    More
}

/**
 * Repressents list in the SECD
 */


export class SECDArray extends SECDElement{
    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }
    
    get printedState(): PrintedState {
        return this._printedState;
    }

    set printedState(value: PrintedState) {
        this._printedState = value;
    }

    arr: Array<SECDElement> = Array()
    private _printedState: PrintedState
    private _name: string
    
    constructor(arr?: SECDArray) {
        super(SECDElementType.Array)
        this._printedState = PrintedState.Not
        this._name = ""
        if(arr) {
            arr.forEach(val => this.arr.push(val))
            this.node = arr.node
        }
        else
            this.arr = []
    }

    /**
     * Remove the first element. If an array is empty InterpreterError is thrown
     */

    shift(): SECDElement{
        let res = this.arr.shift()
        if(typeof(res) == "undefined")
            throw new InterpreterError("Empty array")
        return res
    }

    /**
     * Remove the last element. If an array is empty InterpreterError is thrown
     */

    pop(): SECDElement{
        let res = this.arr.pop()
        if(typeof(res) == "undefined")
            throw new InterpreterError("Empty array")
        return res
    }

    /**
     * Appends val to the array
     * @param val
     */
    
    push(val: SECDElement){
        return this.arr.push(val)
    }

    /**
     * Prepends val to the array
     * @param val
     */

    unshift(val: SECDElement){
        return this.arr.unshift(val)
    }

    /**
     * Combines two arrays.
     * @param other
     */

    concat(other: SECDArray): SECDArray {
        if(this.node == null)
            this.node = other._node
        this.arr = this.arr.concat(other.arr)
        return this
    }

    /**
     * Reverse positions of elements in the array
     */

    reverse(): SECDArray{
        let res = new SECDArray()
        this.arr.forEach(element => {
            if(element instanceof SECDArray)
                element = element.reverse()
            res.unshift(element)
        })
        res.node = this.node
        return res
    }

    /**
     * Get length of the array
     */

    length(): number {
        return this.arr.length
    }

    /**
     * Performs the specified action for each element in an array.
     * @param callbackfn
     * @param thisArg
     */

    forEach(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => void, thisArg?: any): void{
        this.arr.forEach(callbackfn)
    }

    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn
     * @param thisArg
     */

    map<U>(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => U, thisArg?: any): U[]{
        return this.arr.map(callbackfn)
    }

    /**
     * Remove elements from the array
     */

    clear(): void{
        this.arr = []
    }

    /**
     * Set printedState in array and its elements to None
     */

    clearPrinted() {
        if (this._printedState) {
            this._printedState = PrintedState.Not
            this.arr.forEach(element => {
                if (element instanceof SECDArray)
                    element.clearPrinted()
            })
        }
    }

    /**
     * Set colour and printedState to default values
     */

    clean(): void {
        this._colour = ColourType.None
        if(this._printedState === PrintedState.Not) {//This prevents the array to be called infinitely
            this.printedInc()
            this.arr.forEach(item => {
                if (item instanceof SECDArray)
                    item.clean()
                else if (item instanceof SECDValue)
                    item.colour = ColourType.None
            })
        }
        this._printedState = PrintedState.Not
    }

    /**
     * Get element on index
     * @param index
     */
    
    get(index: number): SECDElement{
        return this.arr[index]
    }

    /**
     * True, if array is empty
     */

    empty(): boolean{
        return this.arr.length == 0
    }

    /**
     * Increase the printedState
     */

    printedInc(){
        this._printedState = this._printedState === PrintedState.Not ? PrintedState.Once : PrintedState.More
    }

    /**
     * Change pointers to reduce nodes to its original subtree. Also implements additional logic preventing infinite calls
     */

    removeReduction(){
        super.removeReduction()
        if(this._printedState === PrintedState.Not) {//This prevents the array to be called infinitely
            this.printedInc()
            this.arr.forEach(elem => elem.removeReduction())
        }
        this._printedState = PrintedState.Not
    }

    /**
     * Clone the array
     */

    public clone(): SECDElement {
        let other = new SECDArray()
        this.arr.forEach(item => other.push(item))
        other.node = this.node
        other.name = this.name
        return other
    }

    /**
     * Print the array
     */

    print(): string{
        return '(' + this.arr.map(element => element.print() + " ").reduce((acc, str) => {return acc += str}) + ')'
    }
}