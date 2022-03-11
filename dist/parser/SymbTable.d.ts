import { SECDArray } from "../utility/SECD/SECDArray";
export declare class SymbTable {
    symbols: Array<string>;
    prev: SymbTable;
    constructor(args: string[]);
    push(other: SymbTable): SymbTable;
    pop(): SymbTable;
    add(val: string): void;
    addFront(val: string): void;
    rem(val: string): void;
    getPos(val: string): SECDArray;
    private getPosInner;
}
