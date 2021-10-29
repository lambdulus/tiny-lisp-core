"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbTable = void 0;
const SECDArray_1 = require("./SECDArray");
class SymbTable {
    constructor(args) {
        this.symbols = args;
    }
    push(other) {
        other.prev = this;
        return other;
    }
    pop() {
        return this.prev;
    }
    add(val) {
        this.symbols.push(val);
    }
    rem(val) {
        this.symbols.filter(symbol => symbol != val);
    }
    getPos(val) {
        let res;
        res = new SECDArray_1.SECDArray();
        let numbers = this.getPosInner(val, 0);
        res.push(numbers[0]);
        res.push(numbers[1]);
        return res;
    }
    getPosInner(val, cnt) {
        let res = this.symbols.findIndex(symbol => symbol == val);
        if (res < 0) {
            if (this.prev)
                return this.prev.getPosInner(val, cnt + 1);
            return [-1, -1];
        }
        return [cnt, res];
    }
}
exports.SymbTable = SymbTable;
//# sourceMappingURL=SymbTable.js.map