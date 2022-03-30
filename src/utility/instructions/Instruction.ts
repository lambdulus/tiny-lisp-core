import { ParserError } from "../../parser/ParserErrors";
import {InstructionShortcut} from "./InstructionShortcut";

export class Instruction {
    set shortcut(value: InstructionShortcut) {
        this._shortcut = value;
    }
    get shortcut(): InstructionShortcut {
        return this._shortcut;
    }
    private _shortcut: InstructionShortcut

    constructor(shortcut: InstructionShortcut) {
        this._shortcut = shortcut
    }
    
    public toString(): string{
        return InstructionShortcut[this._shortcut]
    }

    public static toString(shortcut: InstructionShortcut): string{
        switch (shortcut){
            case InstructionShortcut.ADD:
                return "+"
            case InstructionShortcut.SUB:
                return "-"
            case InstructionShortcut.MUL:
                return "*"
            case InstructionShortcut.DIV:
                return "/"
            case InstructionShortcut.EQ:
                return "="
            case InstructionShortcut.NE:
                return "!="
            case InstructionShortcut.HE:
                return ">="
            case InstructionShortcut.HT:
                return ">"
            case InstructionShortcut.LE:
                return "<="
            case InstructionShortcut.LT:
                return "<"
            case InstructionShortcut.CAR:
                return "car"
            case InstructionShortcut.CDR:
                return "cdr"
            case InstructionShortcut.CONSP:
                return "consp"
            case InstructionShortcut.CONS:
                return "cons"
            default:
                throw new ParserError("invalid argument")
        }
    }
} 