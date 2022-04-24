import { InnerNode, ListNode } from "../AST/AST";
import { SECDElement } from "./SECDElement";
export declare enum PrintedState {
    Not = 0,
    Once = 1,
    More = 2
}
export declare class SECDArray extends SECDElement {
    get isClosure(): boolean;
    set isClosure(value: boolean);
    get name(): string;
    set name(value: string);
    get printedState(): PrintedState;
    set printedState(value: PrintedState);
    arr: Array<SECDElement>;
    private _printedState;
    private _name;
    private _isClosure;
    constructor(arr?: SECDArray);
    shift(): SECDElement;
    pop(): SECDElement;
    push(val: SECDElement): number;
    unshift(val: SECDElement): number;
    concat(other: SECDArray): SECDArray;
    reverse(): SECDArray;
    length(): number;
    forEach(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => void, thisArg?: any): void;
    map<U>(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => U, thisArg?: any): U[];
    clear(): void;
    clearPrinted(): void;
    get(index: number): SECDElement;
    empty(): boolean;
    clean(): void;
    getNode(): InnerNode;
    setNode(node: InnerNode): void;
    toString(): string;
    initializeNode(): void;
    toListNode(): ListNode;
    printedInc(): void;
    removeReduction(): void;
    clone(): SECDElement;
    print(): string;
}
