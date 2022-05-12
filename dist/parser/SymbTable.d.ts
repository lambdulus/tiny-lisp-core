import { SECDArray } from "../SECD/SECDArray";
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
    getArgsCnt(name: string): number;
    /**
     * Searches for a variable in the symbtable
     * @param val searched variable
     * @param cnt
     * @private
     */
    getPos(val: string): SECDArray;
    private getPosInner;
    getVarsInCurrScope(): string[];
}
