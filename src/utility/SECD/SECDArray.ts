import {SECDValue} from "./SECDValue"
import {SECDVisitor} from "../visitors/SECDVisitor"
import {InnerNode, ListNode, Node, OperatorNode, StringNode, ValueNode} from "../../AST/AST"
import {ColourType} from "./ColourType"
import {SECDConstant} from "./SECDConstant"
import {SECDElement} from "./SECDElement"
import {SECDElementType} from "./SECDElementType";
import {SECDInvalid} from "./SECDInvalid";
import { InterpreterError } from "../../interpreter/InterpreterErrors"
import { SECDMacro } from "./SECDMacro"

export enum PrintedState{
    Not,
    Once,
    More
}


export class SECDArray extends SECDElement{
    get isClosure(): boolean {
        return this._isClosure;
    }

    set isClosure(value: boolean) {
        this._isClosure = value;
    }
    
    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }
    
    get printedState(): PrintedState {
        return this._printedState;
    }

    set printedState(value: PrintedState) {
        this._printedState = value;
    }
    arr: Array<SECDElement> = Array()
    private _printedState: PrintedState
    private _name: string
    private _isClosure: boolean
    
    constructor(arr?: SECDArray) {
        super(SECDElementType.Array)
        this._printedState = PrintedState.Not
        this._name = ""
        this._isClosure = false
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
        if (this._printedState) {
            this._printedState = PrintedState.Not
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
        if(this._printedState === PrintedState.Not) {
            this.printedInc()
            this.arr.forEach(item => {
                if (item instanceof SECDArray)
                    item.clean()
                else if (item instanceof SECDValue || item instanceof SECDMacro)
                    item.colour = ColourType.None
            })
        }
        this._printedState = PrintedState.Not
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
        if(this._printedState)
            return "[placeholder]"
        this.printedInc()
        if(this._node == null)
            this.initializeNode()
        return "neco"//this._node.toString()
    }

    initializeNode(): void{
        if(!this._node)
            if(!this._printedState)
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

    printedInc(){
        this._printedState = this._printedState === PrintedState.Not ? PrintedState.Once : PrintedState.More
    }

    removeReduction(){
        super.removeReduction()
        if(this._printedState === PrintedState.Not) {
            this.printedInc()
            this.arr.forEach(elem => elem.removeReduction())
        }
        this._printedState = PrintedState.Not
    }

    public clone(): SECDElement {
        return new SECDArray(this)
    }
}