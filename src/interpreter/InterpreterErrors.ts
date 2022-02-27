

export class InterpreterError extends Error{
    constructor (
        public readonly value : string,
    ) { super() }
}