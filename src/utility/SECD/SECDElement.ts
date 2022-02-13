import {InnerNode, Node} from "../../AST/AST";
import {ColourType} from "./ColourType";
import {HasNode} from "../../AST/HasNode";
import {SECDElementType} from "./SECDElementType";


export abstract class SECDElement implements HasNode{
    get type(): SECDElementType {
        return this._type;
    }

    get colour(): ColourType {
        return this._colour;
    }

    set colour(value: ColourType) {
        this._colour = value;
    }

    get node(): InnerNode {
        return this._node;
    }

    set node(value: InnerNode) {
        this._node = value;
    }


    protected _node!: InnerNode
    protected _colour: ColourType
    protected _type: SECDElementType

    constructor(type: SECDElementType) {
        this._type = type
        this._colour = ColourType.None
    }

    setNode(node: InnerNode): void {
        throw new Error("Method not implemented.")
    }
    getNode(): InnerNode {
        throw new Error("Method not implemented.")
    }
}