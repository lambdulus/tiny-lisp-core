import {SECDArray} from "../utility/SECD/SECDArray"
import { SECDValue } from "../utility/SECD/SECDValue";
import { IdentifierInfo } from "./IdentifierInfo";


export class SymbTable{
    symbols: Array<IdentifierInfo>;
    prev!: SymbTable;

    constructor(args: string[]) {
        this.symbols = args.map(arg => new IdentifierInfo(arg, -1))
    }

    push(other: SymbTable): SymbTable{
        other.prev = this;
        return other;
    }

    pop(): SymbTable{
        return this.prev;
    }

    add(val: string, args: number){
        this.symbols.push(new IdentifierInfo(val, args));
    }

    addFront(val: string, args: number){
        this.symbols.unshift(new IdentifierInfo(val, args))
    }

    rem(val: string){
        this.symbols.filter(symbol => symbol.name != val);
    }

    getPos(val: string): SECDArray{
        let res: SECDArray;
        res = new SECDArray();
        let numbers = this.getPosInner(val, 0);
        res.push(new SECDValue(numbers[0]));
        res.push(new SECDValue(numbers[1]));
        return res;
    }
    
    getArgsCnt(name: string): number{
        let res = -1
        this.symbols.forEach(symbol => {
            if (symbol.name == name)
                res = symbol.args
                })
        if(res >= 0)
            return res
        if(this.prev)
            return this.prev.getArgsCnt(name)
        return -1
    }

    private getPosInner(val: string, cnt: number): [number, number]{
        let res = this.symbols.findIndex(symbol => symbol.name == val);
        if(res < 0){
            if(this.prev)
                return this.prev.getPosInner(val, cnt + 1);
            return [-1, -1];
        }
        return [cnt, res];
    }
}