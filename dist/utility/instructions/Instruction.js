"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ParserErrors_1 = require("../../parser/ParserErrors");
const InstructionShortcut_1 = require("./InstructionShortcut");
class Instruction {
    constructor(shortcut) {
        this._shortcut = shortcut;
    }
    set shortcut(value) {
        this._shortcut = value;
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
            case InstructionShortcut_1.InstructionShortcut.CAR:
                return "car";
            case InstructionShortcut_1.InstructionShortcut.CDR:
                return "cdr";
            case InstructionShortcut_1.InstructionShortcut.CONSP:
                return "consp";
            case InstructionShortcut_1.InstructionShortcut.CONS:
                return "cons";
            default:
                throw new ParserErrors_1.ParserError("invalid argument");
        }
    }
}
exports.Instruction = Instruction;
//# sourceMappingURL=Instruction.js.map