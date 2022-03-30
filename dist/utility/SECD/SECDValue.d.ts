import { SECDConstant } from "./SECDConstant";
import { Instruction } from "../instructions/Instruction";
import { InnerNode } from "../../AST/AST";
import { SECDElement } from "./SECDElement";
export declare class SECDValue extends SECDElement {
    get val(): SECDConstant;
    private _val;
    constructor(val: number | string | Instruction, node?: InnerNode);
    getNode(): InnerNode;
    setNode(node: InnerNode): void;
    toString(): string;
    clone(): SECDValue;
}
