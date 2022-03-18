import {SECDValue} from "./SECDValue"
import {SECDVisitor} from "../visitors/SECDVisitor"
import {InnerNode, ListNode, Node, OperatorNode, StringNode, ValueNode} from "../../AST/AST"
import {ColourType} from "./ColourType"
import {SECDConstant} from "./SECDConstant"
import {SECDElement} from "./SECDElement"
import {SECDElementType} from "./SECDElementType";
import {SECDInvalid} from "./SECDInvalid";
import { InterpreterError } from "../../interpreter/InterpreterErrors"

export enum PrintedState{
    NO,
    First,
    More
}


export class SECDArray extends SECDElement{
    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }
    get printed(): PrintedState {
        return this._printed;
    }

    set printed(value: PrintedState) {
        this._printed = value;
    }
    arr: Array<SECDElement> = Array()
    private _printed: PrintedState
    private _name: string
    
    constructor(arr?: SECDArray) {
        super(SECDElementType.Array)
        this._printed = PrintedState.NO
        this._name = ""
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
            throw new InterpreterError("Empty array")
        return res
    }

    pop(): SECDElement{
        let res = this.arr.pop()
        if(typeof(res) == "undefined")
            throw new InterpreterError("Empty array")
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
        if (this._printed) {
            this._printed = PrintedState.NO
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
        if(this._printed === PrintedState.NO) {
            this.printInc()
            this.arr.forEach(item => {
                if (item instanceof SECDArray)
                    item.clean()
                else if (item instanceof SECDValue)
                    item.colour = ColourType.None
            })
        }
        this._printed = PrintedState.NO
    }

    getNode(): InnerNode{
        if(this._node == null)
            this.initializeNode()
        return this._node
    }

    setNode(node: InnerNode): void{
        if(node instanceof InnerNode)
            if(this.arr.length > 0)
                if(typeof(this.arr[this.arr.length - 1].getNode()) == "undefined")//TODO not sure if this should be here
                    this.arr[this.arr.length - 1].setNode(node)
        this._node = node
    }

    toString(): string{
        if(this._printed)
            return "[placeholder]"
        this.printInc()
        if(this._node == null)
            this.initializeNode()
        return "neco"//this._node.toString()
    }

    initializeNode(): void{
        if(!this._printed)
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

    printInc(){
        this._printed = this._printed === PrintedState.NO ? PrintedState.First : PrintedState.More
    }

    removeReduction(){
        super.removeReduction()
        if(this._printed === PrintedState.NO) {
            this.printInc()
            this.arr.forEach(elem => elem.removeReduction())
        }
        this._printed = PrintedState.NO
    }

    public clone(): SECDElement {
        return new SECDArray(this)
    }
}