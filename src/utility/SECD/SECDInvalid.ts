import {SECDElement} from "./SECDElement";
import {SECDElementType} from "./SECDElementType";


export class SECDInvalid extends SECDElement{

    constructor() {
        super(SECDElementType.Invalid)
    }
}