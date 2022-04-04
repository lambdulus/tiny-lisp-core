

export class IdentifierInfo{
    get name(): string {
        return this._name;
    }

    get args(): number {
        return this._args;
    }

    set args(value: number) {
        this._args = value;
    }
    
    private _name: string
    private _args: number

    constructor(name: string, args: number) {
        this._name = name
        this._args = args
    }
}