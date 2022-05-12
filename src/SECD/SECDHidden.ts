import { NullNode, InnerNode } from "..//AST/AST";
import {SECDElement} from "./SECDElement";
import {SECDElementType} from "./SECDElementType";


/**
 * Element storing nodes needed for function application (node of called function and of function call)
 */

export class SECDHidden extends SECDElement{
    get callNode(): InnerNode {
        return this._callNode
    }
    
    set callNode(value: InnerNode) {
        this._callNode = value
    }
    private _callNode: InnerNode

    constructor() {
        super(SECDElementType.Hidden)
        this._callNode = new NullNode()
    }

    public clone(): SECDElement {
        return new SECDHidden()
    }

    public print(): string {
        throw new Error("Method not implemented.");
    }
}