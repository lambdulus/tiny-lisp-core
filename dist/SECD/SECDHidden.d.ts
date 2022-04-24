import { InnerNode } from "..//AST/AST";
import { SECDElement } from "./SECDElement";
export declare class SECDHidden extends SECDElement {
    setNode(node: InnerNode): void;
    getNode(): InnerNode;
    get callNode(): InnerNode;
    set callNode(value: InnerNode);
    private _callNode;
    constructor();
    clone(): SECDElement;
    print(): string;
}
