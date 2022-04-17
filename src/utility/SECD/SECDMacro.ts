import { InnerNode, StringNode } from "../../AST/AST";
import { SECDElement } from "./SECDElement";
import { SECDElementType } from "./SECDElementType";

export class SECDMacro extends SECDElement{
    public clone(): SECDElement {
        throw new Error("Method not implemented.");
    }

    macro: string
    
    constructor(macro: string, node: InnerNode) {
        super(SECDElementType.Macro)
        this.macro = macro
        this._node = node
    }

    add(macro: SECDMacro){
        this.macro += macro.macro;
        //(this._node as StringNode).add(macro.macro)
    }

    getNode(): InnerNode{
        return this._node
    }

    public print(): string {
        throw new Error("Method not implemented.");
    }
}