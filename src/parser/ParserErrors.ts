
export class SyntaxError extends Error{
    constructor (
        public readonly value : string,
    ) { super() }
}

export class ParserError extends Error{
    constructor (
        public readonly value : string,
    ) { super() }
}