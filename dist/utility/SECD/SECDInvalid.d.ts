import { InnerNode } from "../..";
import { SECDElement } from "./SECDElement";
export declare class SECDInvalid extends SECDElement {
    get otherNode(): InnerNode;
    set otherNode(value: InnerNode);
    private _otherNode;
    constructor();
}
