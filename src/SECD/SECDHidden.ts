import { NullNode, InnerNode } from "..//AST/AST";
import {SECDElement} from "./SECDElement";
import {SECDElementType} from "./SECDElementType";


export class SECDHidden extends SECDElement{
    setNode(node: InnerNode): void {
        throw new Error("Method not implemented.");
    }

    getNode(): InnerNode {
        throw new Error("Method not implemented.");
    }

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