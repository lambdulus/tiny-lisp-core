
export class SyntaxError extends Error{
    constructor (
        public readonly value : string,
    ) { super() }
}