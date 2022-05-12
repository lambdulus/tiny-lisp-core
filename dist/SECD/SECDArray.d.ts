import { SECDElement } from "./SECDElement";
export declare enum PrintedState {
    Not = 0,
    Once = 1,
    More = 2
}
/**
 * Repressents list in the SECD
 */
export declare class SECDArray extends SECDElement {
    get name(): string;
    set name(value: string);
    get printedState(): PrintedState;
    set printedState(value: PrintedState);
    arr: Array<SECDElement>;
    private _printedState;
    private _name;
    constructor(arr?: SECDArray);
    /**
     * Remove the first element. If an array is empty InterpreterError is thrown
     */
    shift(): SECDElement;
    /**
     * Remove the last element. If an array is empty InterpreterError is thrown
     */
    pop(): SECDElement;
    /**
     * Appends val to the array
     * @param val
     */
    push(val: SECDElement): number;
    /**
     * Prepends val to the array
     * @param val
     */
    unshift(val: SECDElement): number;
    /**
     * Combines two arrays.
     * @param other
     */
    concat(other: SECDArray): SECDArray;
    /**
     * Reverse positions of elements in the array
     */
    reverse(): SECDArray;
    /**
     * Get length of the array
     */
    length(): number;
    /**
     * Performs the specified action for each element in an array.
     * @param callbackfn
     * @param thisArg
     */
    forEach(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => void, thisArg?: any): void;
    /**
     * Calls a defined callback function on each element of an array, and returns an array that contains the results.
     * @param callbackfn
     * @param thisArg
     */
    map<U>(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => U, thisArg?: any): U[];
    /**
     * Remove elements from the array
     */
    clear(): void;
    /**
     * Set printedState in array and its elements to None
     */
    clearPrinted(): void;
    /**
     * Set colour and printedState to default values
     */
    clean(): void;
    /**
     * Get element on index
     * @param index
     */
    get(index: number): SECDElement;
    /**
     * True, if array is empty
     */
    empty(): boolean;
    /**
     * Increase the printedState
     */
    printedInc(): void;
    /**
     * Change pointers to reduce nodes to its original subtree. Also implements additional logic preventing infinite calls
     */
    removeReduction(): void;
    /**
     * Clone the array
     */
    clone(): SECDElement;
    /**
     * Print the array
     */
    print(): string;
}
