import {InnerNode, Node, ReduceNode} from "../AST/AST";
import {ColourType} from "./ColourType";
import {SECDElementType} from "./SECDElementType";


export abstract class SECDElement {
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
    
    removeReduction(){
        if(this.node)
            if(this.node.parent instanceof ReduceNode) {
                this.node.parent.parent.setNode(this.node.parent.original(), this.node.parent.position)
            }
    }

    public abstract clone(): SECDElement
    
    public abstract print(): string
}