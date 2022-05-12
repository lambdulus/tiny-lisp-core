import { Instruction } from "./instructions/Instruction";


/**
 * Represents constant number, string or instruction in SECD
 */

export type SECDConstant = {
    val: number | string | Instruction
}