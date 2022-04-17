import { InnerNode } from "../..";
import { NullNode } from "../../AST/AST";
import {SECDElement} from "./SECDElement";
import {SECDElementType} from "./SECDElementType";


export class SECDHidden extends SECDElement{
    get callNode(): InnerNode {
        return this._callNode
    }
    
    set callNode(value: InnerNode) {
        this._callNode = value
    }
    private _callNode: InnerNode

    constructor() {
        super(SECDElementType.Invalid)
        this._callNode = new NullNode()
    }

    public clone(): SECDElement {
        return new SECDHidden()
    }

    public print(): string {
        throw new Error("Method not implemented.");
    }
}