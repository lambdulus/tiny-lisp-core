import { InstructionShortcut } from "./InstructionShortcut";
export declare class Instruction {
    set shortcut(value: InstructionShortcut);
    get shortcut(): InstructionShortcut;
    private _shortcut;
    constructor(shortcut: InstructionShortcut);
    /**
     * To shortcut of the instruction
     */
    toString(): string;
    /**
     * To source code keyword of the instruction
     * @param shortcut
     */
    static toSourceCode(shortcut: InstructionShortcut): string;
}
