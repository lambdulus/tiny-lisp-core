import { SECDArray } from "../utility/SECD/SECDArray";
import { IdentifierInfo } from "./IdentifierInfo";
export declare class SymbTable {
    symbols: Array<IdentifierInfo>;
    prev: SymbTable;
    constructor(args: string[]);
    push(other: SymbTable): SymbTable;
    pop(): SymbTable;
    add(val: string, args: number): void;
    addFront(val: string, args: number): void;
    rem(val: string): void;
    getPos(val: string): SECDArray;
    getArgsCnt(name: string): number;
    private getPosInner;
}
