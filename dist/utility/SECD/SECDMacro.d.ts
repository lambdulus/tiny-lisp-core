import { InnerNode } from "../../AST/AST";
import { SECDElement } from "./SECDElement";
export declare class SECDMacro extends SECDElement {
    clone(): SECDElement;
    macro: string;
    constructor(macro: string, node: InnerNode);
    add(macro: SECDMacro): void;
    getNode(): InnerNode;
}
