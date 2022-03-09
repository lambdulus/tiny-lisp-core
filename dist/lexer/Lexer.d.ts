import { LexerToken } from "./LexerTokens";
import { SECDArray } from "../utility/SECD/SECDArray";
export declare class Lexer {
    inputBuffer: String;
    lastChar: string | null;
    currVal: number;
    currIdentifier: string;
    constructor(input: string);
    private getNextChar;
    private loadNonWhitespace;
    private loadFirstChar;
    private static getDataType;
    private loadNumber;
    private static loadIdenToken;
    private loadString;
    private loadIdentifier;
    private loadSpecial;
    private loadListAsSECDArray;
    private loadQuotedElement;
    loadQuotedValue(): SECDArray;
    getNextToken(): LexerToken | null;
    getCurrNumber(): number;
    getCurrString(): string;
}
