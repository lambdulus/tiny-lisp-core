import { InnerNode } from "../..";
import { NullNode } from "../../AST/AST";
import {SECDElement} from "./SECDElement";
import {SECDElementType} from "./SECDElementType";


export class SECDInvalid extends SECDElement{
    get otherNode(): InnerNode {
        return this._otherNode
    }
    
    set otherNode(value: InnerNode) {
        this._otherNode = value
    }
    private _otherNode: InnerNode

    constructor() {
        super(SECDElementType.Invalid)
        this._otherNode = new NullNode()
    }
}