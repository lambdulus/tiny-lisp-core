import { SECDArray } from "./SECDArray";
export declare class SymbTable {
    symbols: Array<string>;
    prev: SymbTable;
    constructor(args: string[]);
    push(other: SymbTable): SymbTable;
    pop(): SymbTable;
    add(val: string): void;
    rem(val: string): void;
    getPos(val: string): SECDArray;
    private getPosInner;
}
