import { LexerToken } from "../lexer/LexerTokens";
import { Lexer } from "../lexer/Lexer";
import { SymbTable } from "./SymbTable";
import { SECDArray } from "./SECDArray";
export declare class Parser {
    symbTable: SymbTable;
    lexer: Lexer;
    currTok: LexerToken | null;
    constructor();
    protected compare(tok: LexerToken): void;
    protected push(arr: SECDArray, val: string | number | SECDArray): number;
    protected isEvaluating(): boolean;
    parse(input: string): SECDArray;
    protected loadInstructions(): SECDArray;
    protected topLevel(): SECDArray;
    protected definition(): SECDArray;
    protected expr(): SECDArray;
    protected expr_body(): SECDArray;
    protected val(): SECDArray;
    protected iden(): SECDArray;
    protected args(): string[];
    protected letBody(): [string[], SECDArray];
    protected beginBody(): SECDArray;
    protected functionCall(): SECDArray;
    protected functionArgs(): SECDArray;
    protected num(): SECDArray;
    protected lambda(args: string[]): SECDArray;
    protected compileQuote(): SECDArray;
    protected compileUnaryOperator(): SECDArray;
    protected compileBinaryOperator(): SECDArray;
    protected compileBackQuote(): SECDArray;
    protected compileComma(): SECDArray;
}