/**
 * Info about an identifier in SymbTable
 */
export declare class IdentifierInfo {
    get name(): string;
    get args(): number;
    set args(value: number);
    private _name;
    private _args;
    constructor(name: string, args: number);
}
