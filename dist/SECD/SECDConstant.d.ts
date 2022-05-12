import { Instruction } from "./instructions/Instruction";
/**
 * Represents constant number, string or instruction in SECD
 */
export declare type SECDConstant = {
    val: number | string | Instruction;
};
