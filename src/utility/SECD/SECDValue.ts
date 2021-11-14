import {SECDConstant} from "./SECDConstant";
import {Instruction} from "../instructions/Instruction";
import { ColourType } from "./ColourType";
import {HasNode} from "../../AST/HasNode";
import {InnerNode, Node} from "../../AST/AST";


export class SECDValue implements HasNode{
    get node(): InnerNode {
        return this._node;
    }

    set node(value: InnerNode) {
        this._node = value;
    }

    get colour(): ColourType {
        return this._colour;
    }

    get val(): SECDConstant{
        return this._val;
    }

    set colour(value: ColourType) {
        this._colour = value;
    }
    private _val: SECDConstant
    private _colour: ColourType
    private _node!: InnerNode

    constructor(val: number | string | Instruction, node?: InnerNode) {
        this._val = val as unknown as SECDConstant
        this._colour = ColourType.None
        if(node != null)
            this.node = node
    }

    public getNode(): InnerNode{
        return this.node
    }

    setNode(node: InnerNode): void {
        if(this._node != null)
            this._node.update(node)
        this.node = node
    }

    public toString() {
        return this._val.toString()
    }
} 