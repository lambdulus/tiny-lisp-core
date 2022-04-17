import {SECDConstant} from "./SECDConstant";
import {Instruction} from "../instructions/Instruction";
import {ColourType} from "./ColourType";
import {InnerNode, Node} from "../../AST/AST";
import {SECDElement} from "./SECDElement";
import {SECDElementType} from "./SECDElementType";


export class SECDValue extends SECDElement{
    get constant(): SECDConstant{
        return this._constant;
    }
    private _constant: SECDConstant

    constructor(constant: number | string | Instruction, node?: InnerNode) {
        super(SECDElementType.Value)
        this._constant = constant as unknown as SECDConstant
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
        if(typeof (this._constant) == "string")
            return "'" + this._constant
        return this._constant.toString()
    }

    public clone(): SECDValue{
        return new SECDValue(this.constant as unknown as number | string | Instruction, this.node.clone())
    }

    public print(): string {
        return this._constant.toString()
    }
} 