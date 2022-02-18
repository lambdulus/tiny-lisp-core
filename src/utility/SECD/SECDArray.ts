import {SECDValue} from "./SECDValue"
import {SECDVisitor} from "../visitors/SECDVisitor"
import {InnerNode, ListNode, Node, StringNode, ValueNode} from "../../AST/AST"
import {ColourType} from "./ColourType"
import {SECDConstant} from "./SECDConstant"
import {SECDElement} from "./SECDElement"
import {SECDElementType} from "./SECDElementType";
import {SECDInvalid} from "./SECDInvalid";

export class SECDArray extends SECDElement{
    arr: Array<SECDElement> = Array()
    printed: boolean
    
    constructor(arr?: SECDArray) {
        super(SECDElementType.Array)
        this.printed = false
        if(arr) {
            arr.forEach(val => this.arr.push(val))
            this.node = arr.node
        }
        else
            this.arr = []
    }
    
    shift(): SECDElement{
        let res = this.arr.shift()
        if(typeof(res) == "undefined")
            return new SECDInvalid()
        return res
    }

    pop(): SECDElement{
        let res = this.arr.pop()
        if(typeof(res) == "undefined")
            return new SECDInvalid()
        return res
    }

    push(val: SECDElement){
        return this.arr.push(val)
    }

    concat(other: SECDArray): SECDArray {
        if(this.node == null)
            this.node = other._node
        this.arr = this.arr.concat(other.arr)
        return this
    }
    
    accept(visitor: SECDVisitor): void{
        visitor.visit(this)
    }
    
    length(): number {
        return this.arr.length
    }

    forEach(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => void, thisArg?: any): void{
        this.arr.forEach(callbackfn)
    }

    map<U>(callbackfn: (value: SECDElement, index: number, array: (SECDElement)[]) => U, thisArg?: any): U[]{
        return this.arr.map(callbackfn)
    }

    clear(): void{
        this.arr = []
    }

    clearPrinted() {
        if (this.printed) {
            this.printed = false
            this.arr.forEach(element => {
                if (element instanceof SECDArray)
                    element.clearPrinted()
            })
        }
    }
    
    get(index: number): SECDElement{
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

    getNode(): InnerNode{
        if(this._node == null)
            this.initializeNode()
        return this._node
    }

    setNode(node: InnerNode): void{
        if(node instanceof InnerNode)
            if(this.arr.length > 0)
                //if(typeof(this.arr[this.arr.length - 1].getNode()) == "undefined")
                    this.arr[this.arr.length - 1].setNode(node)
        this._node = node
    }

    toString(): string{
        if(this.printed)
            return "[placeholder]"
        this.printed = true
        if(this._node == null)
            this.initializeNode()
        return "neco"//this._node.toString()
    }

    initializeNode(): void{
        if(!this.printed)
            if(this.arr.length > 0)
                this._node = this.arr[this.arr.length - 1].getNode()
    }

    toListNode(): ListNode{
        let nodes = Array()
        this.arr.forEach(item => {
                if (item.getNode() != undefined)
                    nodes.push(item.node)
                else {//TODO maybe not needed
                    if (item instanceof SECDArray) {
                        nodes.push(item.toListNode())
                    } else if (item instanceof SECDValue) {
                        let val = (<SECDConstant>item.val)
                        if (typeof (val) == "number" || typeof (val) == "boolean")
                            nodes.push(new ValueNode(val))
                        else if (typeof (val) == "string")
                            nodes.push(new StringNode(val))
                    }
                }
            }
        )
        return new ListNode(nodes)
    }
}