import { SECDVisitor } from "../visitors/SECDVisitor";
import { InnerNode, ListNode } from "../../AST/AST";
import { SECDElement } from "./SECDElement";
export declare enum PrintedState {
    NO = 0,
    First = 1,
    More = 2
}
export declare class SECDArray extends SECDElement {
    get name(): string;
    set name(value: string);
    get printed(): PrintedState;
    set printed(value: PrintedState);
    arr: Array<SECDElement>;
    private _printed;
    private _name;
    constructor(arr?: SECDArray);
    shift(): SECDElement;
    pop(): SECDElement;
    push(val: SECDElement): number;
    concat(other: SECDArray): SECDArray;
    accept(visitor: SECDVisitor): void;
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
    printInc(): void;
    removeReduction(): void;
}
