import { LexerToken } from "./LexerTokens";
export declare class Lexer {
    inputBuffer: string;
    lastChar: string | null;
    currVal: number;
    currIdentifier: string;
    constructor(input: string);
    /**
     * Loads next char from the source code
     * @private
     */
    private getNextChar;
    /**
     * Loads next non whitespace char
     * @private
     */
    private loadNonWhitespace;
    /**
     * If lastChar is not non whitespace character it loads next non whitespace character.
     */
    removeWhitespaces(): void;
    /**
     * If lastChar is not null and not whitespace return it. Othrewise return next non whitespace character.
     * @private
     */
    private loadFirstChar;
    /**
     * Get type of the token based on the first character
     * @param char - first character
     * @private
     */
    private static getTokenType;
    /**
     * Loads number and stores it to currVal variable
     * @param result - first digit of the number
     * @private
     */
    private loadNumber;
    /**
     * Loads keyword token
     * @param str - first token of the keyword
     * @private
     */
    private static loadKeywordToken;
    /**
     * Load string in "". Current not used so maybe remove it
     * @private
     */
    private loadString;
    /**
     * Load identifier and stores it in currIdentifier variable
     * @param result - first letter of the identifier
     * @private
     */
    private loadIdentifier;
    /**
     * Loads special character lexer token
     * @param currChar  - first letter of the token
     * @private
     */
    private loadSpecial;
    /**
     * Get next lexer token
     */
    getNextToken(): LexerToken;
    getCurrNumber(): number;
    getCurrString(): string;
}
