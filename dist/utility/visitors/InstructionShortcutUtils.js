"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InstructionShortcut_1 = require("../instructions/InstructionShortcut");
class InstructionShortcutUtils {
    static toString(shorcut) {
        switch (shorcut) {
            case InstructionShortcut_1.InstructionShortcut.NIL:
            case InstructionShortcut_1.InstructionShortcut.LD:
            case InstructionShortcut_1.InstructionShortcut.LDC:
            case InstructionShortcut_1.InstructionShortcut.LDF:
            case InstructionShortcut_1.InstructionShortcut.ADD:
            case InstructionShortcut_1.InstructionShortcut.SUB:
            case InstructionShortcut_1.InstructionShortcut.MUL:
            case InstructionShortcut_1.InstructionShortcut.DIV:
            case InstructionShortcut_1.InstructionShortcut.EQ:
            case InstructionShortcut_1.InstructionShortcut.NE:
            case InstructionShortcut_1.InstructionShortcut.LT:
            case InstructionShortcut_1.InstructionShortcut.HT:
            case InstructionShortcut_1.InstructionShortcut.LE:
            case InstructionShortcut_1.InstructionShortcut.HE:
            case InstructionShortcut_1.InstructionShortcut.OR:
            case InstructionShortcut_1.InstructionShortcut.AND:
            case InstructionShortcut_1.InstructionShortcut.SEL:
            case InstructionShortcut_1.InstructionShortcut.JOIN:
            case InstructionShortcut_1.InstructionShortcut.CONS:
            case InstructionShortcut_1.InstructionShortcut.CAR:
            case InstructionShortcut_1.InstructionShortcut.CDR:
            case InstructionShortcut_1.InstructionShortcut.CONSP:
            case InstructionShortcut_1.InstructionShortcut.POP:
            case InstructionShortcut_1.InstructionShortcut.AP:
            case InstructionShortcut_1.InstructionShortcut.RAP:
            case InstructionShortcut_1.InstructionShortcut.RTN:
            case InstructionShortcut_1.InstructionShortcut.DUM:
            case InstructionShortcut_1.InstructionShortcut.DEFUN:
            default:
                return " ";
        }
    }
}
exports.InstructionShortcutUtils = InstructionShortcutUtils;
//# sourceMappingURL=InstructionShortcutUtils.js.map