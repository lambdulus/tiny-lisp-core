import {SECDConstant} from "./SECDConstant";
import {Instruction} from "../instructions/Instruction";
import {ColourType} from "./ColourType";
import {InnerNode, Node} from "../../AST/AST";
import {SECDElement} from "./SECDElement";
import {SECDElementType} from "./SECDElementType";


export class SECDValue extends SECDElement{
    get val(): SECDConstant{
        return this._val;
    }
    private _val: SECDConstant

    constructor(val: number | string | Instruction, node?: InnerNode) {
        super(SECDElementType.Value)
        this._val = val as unknown as SECDConstant
        this._colour = ColourType.None
        if(node != null)
            this.node = node
    }

    public getNode(): InnerNode{
        return this._node
    }

    setNode(node: InnerNode): void {
        if(this._node != null)
            this._node.update(node, false)
        this.node = node
    }

    public toString() {
        return this._val.toString()
    }
} 