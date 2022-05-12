import { SECDConstant } from "./SECDConstant";
import { Instruction } from "./instructions/Instruction";
import { InnerNode } from "../AST/AST";
import { SECDElement } from "./SECDElement";
/**
 * Represents a value in SECD
 */
export declare class SECDValue extends SECDElement {
    get constant(): SECDConstant;
    private _constant;
    constructor(constant: number | string | Instruction, node?: InnerNode);
    toString(): string;
    clone(): SECDValue;
    print(): string;
}
