import { LexerToken } from "../lexer/LexerTokens";
import { Lexer } from "../lexer/Lexer";
import { SymbTable } from "./SymbTable";
import { SECDArray } from "../SECD/SECDArray";
import { TopNode } from "../AST/AST";
export declare class Parser {
    get topNode(): TopNode | null;
    symbTable: SymbTable;
    quoted: boolean;
    isMacro: boolean;
    macros: Map<string, SECDArray>;
    callable: Map<string, SECDArray>;
    lexer: Lexer;
    currTok: LexerToken;
    private _topNode;
    letBodys: Array<string>;
    constructor();
    /**
     * Performs ll-parsing compare operation
     * @param tok lexer token
     * @private
     */
    private compare;
    /**
     * compile and parse source code
     * @param sourceCode source code
     * @param args
     */
    parse(sourceCode: string, args?: SymbTable, isMacroExpansion?: boolean): SECDArray;
    /**
     * inner method to compile and parse source code
     * @private
     */
    private loadInstructions;
    /**
     * Compiles next top level definition
     * @private
     */
    private topLevel;
    /**
     * Compiles top statement definition
     * @private
     */
    private definition;
    /**
     *
     * @param isMacroCall - true if it is call of macro
     * @private
     */
    private expr;
    /**
     * Compiles body of the expression
     * @private
     */
    private expr_body;
    /**
     * Compiles value
     * @param isMacroCall - true if inside of a macro call, otherwise false
     * @private
     */
    private val;
    /**
     * Compiles an identifier
     * @private
     */
    private iden;
    /**
     * Loads arguments of a function
     * @private
     */
    private args;
    /**
     * Compiles bindings of let/letrec expression
     * @private
     */
    private letBindings;
    /**
     * Compiles expressions inside of a begin statement
     * @private
     */
    private beginBody;
    private functionCall;
    /**
     * Compiles arguments of a function/macro call or a list, if it is quoted
     * @param isMacroCall
     * @private
     */
    private listElements;
    /**
     * Compiles string
     * @private
     */
    private str;
    /**
     * Compiles number
     * @private
     */
    private num;
    /**
     * Compiles lambda function
     * @param args - node containing arguments of the lambda
     * @param isCall
     * @private
     */
    private lambdaBody;
    /**
     * Compiles unary operator
     * @param instructionShortcut - shortcut of the operator
     * @private
     */
    private compileUnaryOperator;
    /**
     * Compiles binary expression
     * @param instructionShortcut - shortcut of the operator
     * @private
     */
    private compileBinaryOperator;
    /**
     * Compiles quote and the following expression
     * @private
     */
    private compileQuote;
    /**
     * Compiles comma and the following expression
     * @private
     */
    private compileComma;
    /**
     * Converts currTok of type LexerToken to equivalent InstructionShortcut
     * @private
     */
    private getOperator;
}
