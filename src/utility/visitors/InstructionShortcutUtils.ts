import { InstructionShortcut } from "../instructions/InstructionShortcut"

export class InstructionShortcutUtils{

    static toString(shorcut: InstructionShortcut): string{
        switch (shorcut) {
            case InstructionShortcut.NIL:
            case InstructionShortcut.LD:
            case InstructionShortcut.LDC:
            case InstructionShortcut.LDF:
            case InstructionShortcut.ADD:
            case InstructionShortcut.SUB:
            case InstructionShortcut.MUL:
            case InstructionShortcut.DIV:
            case InstructionShortcut.EQ:
            case InstructionShortcut.NE:
            case InstructionShortcut.LT:
            case InstructionShortcut.HT:
            case InstructionShortcut.LE:
            case InstructionShortcut.HE:
            case InstructionShortcut.OR:
            case InstructionShortcut.AND:
            case InstructionShortcut.SEL:
            case InstructionShortcut.JOIN:
            case InstructionShortcut.CONS:
            case InstructionShortcut.CAR:
            case InstructionShortcut.CDR:
            case InstructionShortcut.CONSP:
            case InstructionShortcut.POP:
            case InstructionShortcut.AP:
            case InstructionShortcut.RAP:
            case InstructionShortcut.RTN:
            case InstructionShortcut.DUM:
            case InstructionShortcut.DEFUN:
            default:
                return " "
        }
    }
}