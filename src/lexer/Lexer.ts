import {TokenType} from "./TokenType";
import {LexerToken} from "./LexerTokens";
import {SECDArray} from "../SECD/SECDArray"
import {SECDValue} from "../SECD/SECDValue";
import { LexerError } from "./LexerErrors";

export class Lexer{

    inputBuffer: string;
    lastChar: string | null;
    currVal: number;
    currIdentifier: string;
    isMacroExpansion: boolean

    constructor(input: string, isMacroExpansion: boolean) {
        this.inputBuffer = input;
        this.lastChar = null
        this.currVal = 0
        this.currIdentifier = ""
        this.isMacroExpansion = isMacroExpansion
    }

    /**
     * Loads next char from the source code
     * @private
     */

    private getNextChar(): string | null{
        if(this.inputBuffer) {
            const result = this.inputBuffer.charAt(0);
            this.inputBuffer = this.inputBuffer.substring(1);
            return result;
        }
        return null;
    }

    /**
     * Loads next non whitespace char
     * @private
     */

    private loadNonWhitespace(): string | null{
        let res = this.getNextChar();
        if(!res)
            return null;
        if(Lexer.getTokenType(res) == TokenType.WHITESPACE)
            return this.loadNonWhitespace();
        return res;
    }

    /**
     * If lastChar is not non whitespace character it loads next non whitespace character.
     */

    public removeWhitespaces(): void{
        while(this.lastChar == null || Lexer.getTokenType(this.lastChar) === TokenType.WHITESPACE)
            this.lastChar = this.getNextChar()
    }

    /**
     * If lastChar is not null and not whitespace return it. Othrewise return next non whitespace character.
     * @private
     */

    private loadFirstChar(): string | null{
        let dataType = Lexer.getTokenType(this.lastChar);
        return (dataType == TokenType.INVALID || dataType == TokenType.WHITESPACE)
            ? this.loadNonWhitespace() : this.lastChar;
    }

    /**
     * Get type of the token based on the first character
     * @param char - first character
     * @private
     */

    private static getTokenType(char: string | null): TokenType {
        if(!char)
            return TokenType.INVALID;
        if(char == "\"")
            return TokenType.STRING
        if(char.match(/[0-9]/i))
            return TokenType.NUMBER;
        else if(char.match(/[a-z]|[A-Z]"/i))
            return TokenType.IDENTIFIER;
        else if(!/\S/.test(char)){
            return TokenType.WHITESPACE;
        }
        return TokenType.SPEC
    }

    /**
     * Loads number and stores it to currVal variable
     * @param result - first digit of the number
     * @private
     */

    private loadNumber(result: number): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getTokenType(currChar);
        while (currDataType == TokenType.NUMBER) {
            result = result * 10 + Number(currChar);
            currChar = this.getNextChar();
            currDataType = Lexer.getTokenType(currChar);
        }
        this.lastChar = currChar;
        this.currIdentifier = result.toString();
        this.currVal = result;
        return LexerToken.Num;
    }

    /**
     * Loads keyword token
     * @param str - first token of the keyword
     * @private
     */

    private static loadKeywordToken(str: string): LexerToken{
        switch (str) {
            case "if":
                return LexerToken.if;
            case "let":
                return LexerToken.let;
            case "letrec":
                return LexerToken.letrec;
            case "lambda":
                return LexerToken.lambda;
            case "begin":
                return LexerToken.begin;
            case "car":
                return LexerToken.car;
            case "cdr":
                return LexerToken.cdr;
            case "cons":
                return LexerToken.cons;
            case "consp":
                return LexerToken.consp;
            case "define":
                return LexerToken.define;
            case "define-macro":
                return LexerToken.defMacro;
            case "null":
                return LexerToken.null
            default:
                return LexerToken.Iden;
        }
    }

    /**
     * Load string in "". Current not used so maybe remove it
     * @private
     */

    private loadString(): LexerToken{
        let currChar = this.getNextChar();
        let res = ""
        while (currChar != "\"") {
            res += currChar
            currChar = this.getNextChar();
        }
        this.lastChar = null
        this.currIdentifier = res
        return LexerToken.Str
    }

    /**
     * Load identifier and stores it in currIdentifier variable
     * @param result - first letter of the identifier
     * @private
     */

    private loadIdentifier(result: string): LexerToken{
        let currChar = this.getNextChar();
        let currDataType = Lexer.getTokenType(currChar);
        while (currDataType == TokenType.NUMBER || currDataType == TokenType.IDENTIFIER || currChar == "-" || currChar == "_" ) {
            result += currChar;
            currChar = this.getNextChar();
            currDataType = Lexer.getTokenType(currChar);
        }
        this.currIdentifier = result;
        this.lastChar = currChar;
        return Lexer.loadKeywordToken(result);
    }

    /**
     * Loads special character lexer token
     * @param currChar  - first letter of the token
     * @private
     */

    private loadSpecial(currChar: string | null): LexerToken{
        switch (currChar){
            case "+":
                return LexerToken.plus;
            case "-":
                return LexerToken.minus;
            case "*":
                return LexerToken.times;
            case "/":
                return LexerToken.division;
            case "<":
                currChar = this.getNextChar();
                if(currChar == "=") {
                    this.currIdentifier += currChar;
                    return LexerToken.le;
                }
                this.lastChar = currChar;
                return LexerToken.lt;
            case "=":
                return LexerToken.eq;
            case ">":
                currChar = this.getNextChar();
                if(currChar == "=") {
                    this.currIdentifier += currChar;
                    return LexerToken.he;
                }
                this.lastChar = currChar;
                return LexerToken.ht;
            case "(":
                return LexerToken.leftBracket;
            case ")":
                return LexerToken.rightBracket;
            case "'":
                return LexerToken.quote;
            case "`":
                return LexerToken.backQuote;
            case ",":
                return LexerToken.comma;
            case "#"://load boolean
                currChar = this.getNextChar();
                this.currIdentifier += currChar;
                if(currChar == "t") {
                    this.currVal = 1;
                    return LexerToken.Bool;
                }
                else if(currChar == "f") {
                    this.currVal = 0;
                    return LexerToken.Bool;
                }
                throw new LexerError("Lexer does not expect " + currChar + "after #.")
            case "\"":
                this.getNextToken()
                return LexerToken.Str
            case "!":
                if(this.isMacroExpansion){//Identifiers starting with '!' are allowed in macro expanded code. They are generated from the gensym.
                    return this.loadIdentifier(currChar)
                }
            default:
                throw new LexerError("Lexer does not support identifier starting with: " + currChar)
        }
    }

    /**
     * Get next lexer token
     */

    public getNextToken(): LexerToken{
        let currChar = this.loadFirstChar();
        let currDataType: TokenType;
        this.lastChar = null;
        if(!currChar)
            return LexerToken.end;
        this.currIdentifier = currChar;
        currDataType = Lexer.getTokenType(currChar);
        switch(currDataType){
            case TokenType.NUMBER:
                return this.loadNumber(Number(currChar));
            case TokenType.IDENTIFIER:
                return this.loadIdentifier(currChar);
            case TokenType.SPEC:
                return this.loadSpecial(currChar);
            case TokenType.STRING:
                return this.loadString()
            default://If loaded just whitespaces
                return LexerToken.end
        }
    }

    /**
     * Returns the value of the last number token
     */

    public getCurrNumber(): number{
        return this.currVal;
    }

    /**
     * Returns the name of the last identifier token
     */

    public getCurrString(): string{
        return this.currIdentifier;
    }

    /**
     * Loads current expr in source code as string.
     * @param brackets Number of already loaded left brackets
     * @param token current lexer token in parser
     */

    public loadExpr(brackets = 0, token = LexerToken.false): string{
        if(token === LexerToken.Num) {
            return this.currVal.toString()
        }
        else if(token === LexerToken.Iden){
            return this.currIdentifier
        }
        let currChar = this.loadFirstChar()
        if(!currChar)
            throw new LexerError("Unexpected EOF")
        let currDataType = Lexer.getTokenType(currChar)
        if(brackets)
            return this.loadExprWithBrackets(brackets, currChar)
        switch (currDataType){
            case TokenType.IDENTIFIER:
                this.loadIdentifier(currChar)
                return this.currIdentifier
            case TokenType.NUMBER:
                this.loadNumber(Number(currChar))
                return this.currVal.toString()
            case TokenType.SPEC:
                return this.loadExprWithBrackets(brackets, currChar)
            default:
                throw new LexerError("Unexpected source code")
        }
    }

    /**
     * Load expression inside brackets from the source code
     * @param brackets number of already loaded left brackets
     * @param result result string
     */

    loadExprWithBrackets(brackets: number, result: string): string {
        let currChar: string | null = result
        while(true) {
            if (currChar == '(')
                brackets ++
            else if (currChar == ')')
                brackets --
            if(!brackets)
                break
            currChar = this.getNextChar()
            result += currChar
        }
        return result
    }

}