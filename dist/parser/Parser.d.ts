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
    macros: Map<string, SECDArray>;
    callable: Map<string, SECDArray>;
    lexer: Lexer;
    currTok: LexerToken | null;
    private _topNode;
    constructor();
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
    /**
     *
     * @param isMacroCall
     * @param bindedVar Variable binded to an expression in let statement
     * @protected
     */
    protected expr(isMacroCall?: boolean, bindedVar?: null | string): SECDArray;
    /**
     *
     * @param bindedVar Variable binded to an expression in let statement
     * @protected
     */
    protected expr_body(bindedVar?: null | string): SECDArray;
    protected val(isMacroCall?: boolean): SECDArray;
    /**
     *
     * @param isCall wheater iden is beginning identifier of function call
     * @protected
     */
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
    /**
     * Returns compiled code of binary expression and its arguments
     * @param instructionShortcut shortcup of the operator
     * @protected
     */
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
