"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InstructionShortcut_1 = require("./InstructionShortcut");
class Instruction {
    constructor(shortcut) {
        this._shortcut = shortcut;
    }
    get shortcut() {
        return this._shortcut;
    }
    toString() {
        return InstructionShortcut_1.InstructionShortcut[this._shortcut];
    }
    static toString(shortcut) {
        switch (shortcut) {
            case InstructionShortcut_1.InstructionShortcut.ADD:
                return "+";
            case InstructionShortcut_1.InstructionShortcut.SUB:
                return "-";
            case InstructionShortcut_1.InstructionShortcut.MUL:
                return "*";
            case InstructionShortcut_1.InstructionShortcut.DIV:
                return "/";
            case InstructionShortcut_1.InstructionShortcut.EQ:
                return "=";
            case InstructionShortcut_1.InstructionShortcut.NE:
                return "!=";
            case InstructionShortcut_1.InstructionShortcut.HE:
                return ">=";
            case InstructionShortcut_1.InstructionShortcut.HT:
                return ">";
            case InstructionShortcut_1.InstructionShortcut.LE:
                return "<=";
            case InstructionShortcut_1.InstructionShortcut.LT:
                return "<";
            default:
                return InstructionShortcut_1.InstructionShortcut[shortcut];
        }
    }
}
exports.Instruction = Instruction;
//# sourceMappingURL=Instruction.js.map