import { InstructionShortcut } from "./InstructionShortcut";
export declare class Instruction {
    get shortcut(): InstructionShortcut;
    private _shortcut;
    constructor(shortcut: InstructionShortcut);
    toString(): string;
    static toString(shortcut: InstructionShortcut): string;
}
