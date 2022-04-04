import { LexerToken } from "../lexer/LexerTokens";
import { Lexer } from "../lexer/Lexer";
import { SymbTable } from "./SymbTable";
import { SECDArray } from "../utility/SECD/SECDArray";
import { InstructionShortcut } from "../utility/instructions/InstructionShortcut";
import { CompositeNode, InnerNode, TopNode } from "../AST/AST";
/**
 *
 * Parser
 */
export declare class Parser {
    get topNode(): TopNode | null;
    symbTable: SymbTable;
    quoted: boolean;
    isMacro: boolean;
    macros: Array<string>;
    lexer: Lexer;
    currTok: LexerToken | null;
    isMainCode: boolean;
    private _topNode;
    constructor(mainCode?: boolean);
    /**
     * Performs ll-parsing compare operation
     * @param tok lexer token
     * @protected
     */
    protected compare(tok: LexerToken): void;
    /**
     *
     * @param sourceCode source code
     * @param args
     */
    parse(sourceCode: string, args?: SymbTable): SECDArray;
    protected loadInstructions(): SECDArray;
    protected topLevel(): [SECDArray, InnerNode];
    protected definition(): [SECDArray, InnerNode];
    protected expr(isMacroCall?: boolean): SECDArray;
    protected expr_body(): SECDArray;
    protected val(): SECDArray;
    protected iden(): SECDArray;
    protected args(): string[];
    protected letBody(): [string[], SECDArray];
    /**
     * Compiles expressions inside of begin statement
     * @protected
     */
    protected beginBody(): SECDArray;
    protected functionCall(): SECDArray;
    protected functionArgs(isMacroCall: boolean): SECDArray;
    protected str(): SECDArray;
    protected num(): SECDArray;
    protected lambda(args: CompositeNode, isCall?: number): SECDArray;
    protected compileUnaryOperator(instructionShortcut: InstructionShortcut): SECDArray;
    protected compileBinaryOperator(instructionShortcut: InstructionShortcut): SECDArray;
    protected compileQuote(): SECDArray;
    protected compileComma(): SECDArray;
    /**
     * Converts currTok of type LexerToken to equivalent InstructionShortcut
     * @private
     */
    private getOperator;
    private compileMacro;
}
