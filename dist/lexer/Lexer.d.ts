import { LexerToken } from "./LexerTokens";
import { SECDArray } from "../parser/SECDArray";
export declare class Lexer {
    get isEvaluating(): boolean;
    set isEvaluating(value: boolean);
    inputBuffer: String;
    lastChar: string | null;
    currVal: number;
    currIdentifier: string;
    preprocessorStr: string;
    _isEvaluating: boolean;
    constructor(input: string);
    resetPreprocessorStr(): void;
    private getNextChar;
    private loadNonWhitespace;
    private loadFirstChar;
    private static getDataType;
    private loadNumber;
    private static loadIdenToken;
    private loadIdentifier;
    private loadSpecial;
    private loadListAsSECDArray;
    private loadQuotedElement;
    loadQuotedValue(): SECDArray;
    getNextToken(): LexerToken | null;
    getCurrNumber(): number;
    getCurrString(): string;
    getPreprocessorString(): string;
}
