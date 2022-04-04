import { LexerToken } from "../lexer/LexerTokens";


export class LexerTokenUtils{
    
    static toString(token: LexerToken): string{
        switch (token) {
            case LexerToken.Iden:
                return "identifier"
            case LexerToken.Str:
                return "string"
            case LexerToken.Num:
                return "number"
            case LexerToken.Bool:
                return "bool"
            case LexerToken.define:
                return "define"
            case LexerToken.defBasicMacro:
            case LexerToken.defHygMacro:
                return "def-macro"
            case LexerToken.struct:
            case LexerToken.if:
                return "if"
            case LexerToken.let:
                return "let"
            case LexerToken.letrec:
                return "letrec"
            case LexerToken.lambda:
                return "lambda"
            case LexerToken.begin:
                return "begin"
            case LexerToken.printf:
            case LexerToken.null:
            case LexerToken.car:
            case LexerToken.cdr:
            case LexerToken.consp:
                return "unary-operator"
            case LexerToken.or:
            case LexerToken.and:
            case LexerToken.plus:
            case LexerToken.minus:
            case LexerToken.times:
            case LexerToken.division:
            case LexerToken.lt:
            case LexerToken.le:
            case LexerToken.eq:
            case LexerToken.ne:
            case LexerToken.he:
            case LexerToken.ht:
                return "binary-operator"
            case LexerToken.leftBracket:
                return "("
            case LexerToken.rightBracket:
                return ")"
            case LexerToken.comma:
                return ","
            case LexerToken.dot:
                return "."
            case LexerToken.quote:
                return "'"
            case LexerToken.backQuote:
                return "`"
            case LexerToken.true:
            case LexerToken.false:
            default: 
                return " "
        }
    }
}