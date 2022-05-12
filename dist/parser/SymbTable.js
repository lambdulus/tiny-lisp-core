"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbTable = void 0;
const SECDArray_1 = require("../SECD/SECDArray");
const SECDValue_1 = require("../SECD/SECDValue");
const IdentifierInfo_1 = require("./IdentifierInfo");
class SymbTable {
    constructor(args) {
        this.symbols = args.map(arg => new IdentifierInfo_1.IdentifierInfo(arg, -1));
    }
    push(other) {
        other.prev = this;
        return other;
    }
    pop() {
        return this.prev;
    }
    add(val, args) {
        if (this.symbols.every(symbol => symbol.name != val))
            this.symbols.push(new IdentifierInfo_1.IdentifierInfo(val, args));
    }
    addFront(val, args) {
        if (this.symbols.every(symbol => symbol.name != val))
            this.symbols.unshift(new IdentifierInfo_1.IdentifierInfo(val, args));
    }
    rem(val) {
        this.symbols = this.symbols.filter(symbol => symbol.name != val);
    }
    getArgsCnt(name) {
        let res = -1;
        this.symbols.forEach(symbol => {
            if (symbol.name == name)
                res = symbol.args;
        });
        if (res >= 0)
            return res;
        if (this.prev)
            return this.prev.getArgsCnt(name);
        return res;
    }
    /**
     * Searches for a variable in the symbtable
     * @param val searched variable
     * @param cnt
     * @private
     */
    getPos(val) {
        let res;
        res = new SECDArray_1.SECDArray();
        let numbers = this.getPosInner(val, 0);
        res.push(new SECDValue_1.SECDValue(numbers[0]));
        res.push(new SECDValue_1.SECDValue(numbers[1]));
        return res;
    }
    getPosInner(val, cnt) {
        let res = this.symbols.findIndex(symbol => symbol.name == val);
        if (res < 0) {
            if (this.prev)
                return this.prev.getPosInner(val, cnt + 1);
            return [-1, -1];
        }
        return [cnt, res];
    }
    getVarsInCurrScope() {
        return this.symbols.map(symbol => symbol.name);
    }
}
exports.SymbTable = SymbTable;
//# sourceMappingURL=SymbTable.js.map