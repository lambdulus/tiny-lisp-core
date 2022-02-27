

export class LexerError extends Error{
    constructor (
        public readonly value : string,
    ) { super() }
}