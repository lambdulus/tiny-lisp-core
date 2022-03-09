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
        return InstructionShortcut_1.InstructionShortcut[this._shortcut]; /*
        switch (this._shortcut){
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
            default:

        }*/
    }
}
exports.Instruction = Instruction;
//# sourceMappingURL=Instruction.js.map