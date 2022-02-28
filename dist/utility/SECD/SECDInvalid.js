"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECDInvalid = void 0;
const SECDElement_1 = require("./SECDElement");
const SECDElementType_1 = require("./SECDElementType");
class SECDInvalid extends SECDElement_1.SECDElement {
    constructor() {
        super(SECDElementType_1.SECDElementType.Invalid);
    }
}
exports.SECDInvalid = SECDInvalid;
//# sourceMappingURL=SECDInvalid.js.map