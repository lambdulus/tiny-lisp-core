import { InnerNode } from "..//AST/AST";
import { SECDElement } from "./SECDElement";
/**
 * Element storing nodes needed for function application (node of called function and of function call)
 */
export declare class SECDHidden extends SECDElement {
    get callNode(): InnerNode;
    set callNode(value: InnerNode);
    private _callNode;
    constructor();
    clone(): SECDElement;
    print(): string;
}
