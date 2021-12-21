import {SECDValue} from "./SECDValue";
import {SECDVisitor} from "../visitors/SECDVisitor";
import {InnerNode, Node} from "../../AST/AST";
import {HasNode} from "../../AST/HasNode";
import {ColourType} from "./ColourType";

export class SECDArray implements HasNode{
    get colour(): ColourType {
        return this._colour;
    }

    set colour(value: ColourType) {
        this._colour = value;
    }

    get node(): Node {
        return this._node;
    }
    set node(value: Node) {
        this._node = value;
    }
    arr: Array< SECDValue | SECDArray > = Array()
    private _node!: Node
    private _colour: ColourType
    
    constructor(arr?: SECDArray) {
        this._colour = ColourType.None
        if(arr) {
            arr.forEach(val => this.arr.push(val));
            this.node = arr.node
        }
        else
            this.arr = []
    }
    
    shift(): SECDValue | SECDArray | undefined {
        return this.arr.shift() as SECDValue | SECDArray;
    }

    pop(): SECDValue | SECDArray | undefined {
        return this.arr.pop() as SECDValue | SECDArray;
    }

    push(val: SECDValue | SECDArray | undefined ){
        return this.arr.push(val as SECDValue | SECDArray);
    }

    concat(other: SECDArray): SECDArray {
        if(this.node == null)
            this.node = other._node
        this.arr = this.arr.concat(other.arr);
        return this
    }
    
    accept(visitor: SECDVisitor): void{
        visitor.visit(this)
    }
    
    length(): number {
        return this.arr.length
    }

    forEach(callbackfn: (value: SECDArray | SECDValue, index: number, array: (SECDArray | SECDValue)[]) => void, thisArg?: any): void{
        this.arr.forEach(callbackfn)
    }

    map<U>(callbackfn: (value: SECDArray | SECDValue, index: number, array: (SECDArray | SECDValue)[]) => U, thisArg?: any): U[]{
        return this.arr.map(callbackfn);
    }

    clear(): void{
        this.arr = []
    }
    
    get(index: number): SECDArray | SECDValue{
        return this.arr[index]
    }

    empty(): boolean{
        return this.arr.length == 0
    }

    clean(): void {
        this._colour = ColourType.None
        this.arr.forEach(item => {
            if(item instanceof SECDArray)
                item.clean()
            else if(item instanceof SECDValue)
                item.colour = ColourType.None
        })
    }

    getNode(): Node{
        if(this._node == null)
            this.initializeNode()
        return this._node
    }

    setNode(node: Node): void{
        if(node instanceof InnerNode)
            if(this.arr.length > 0)
                this.arr[this.arr.length - 1].setNode(node)
        this._node = node
    }

    toString(): string{
        if(this._node == null)
            this.initializeNode()
        return this._node.toString()
    }

    initializeNode(): void{
        this._node = this.arr[this.arr.length - 1].getNode()
    }

    /*
    public popn(cnt: number): SECDArray{
        let result: SECDArray = new SECDArray();
        for(let i = 0; i < cnt; i ++){
            result.push(this.pop());
        }
        return result;
    }*/
    /*
        public popArray(): SECDArray{
            let x = this.pop()
            if(Array.isArray(x))
                return x
            return null
        }*/
}