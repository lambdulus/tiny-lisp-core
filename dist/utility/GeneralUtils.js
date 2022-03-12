"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class GeneralUtils {
    static getFunctionName(node) {
        if (node instanceof __1.FuncNode) {
            return node.func.print();
        }
        else if (node instanceof __1.LetNode) {
            return node.body.func.print();
        }
        else if (node instanceof __1.LambdaNode) {
            console.log("NEJAKY DEBUG VYPIS", node.parent, node);
            let parent = node.parent;
            if (parent instanceof __1.EndNode) {
                if (parent.next instanceof __1.VarNode)
                    return parent.next.print();
                return parent.parent.body.func.print();
            }
            return parent.body.func.print();
        }
        else if (node instanceof __1.DefineNode) {
            return node.name;
        }
        return "";
    }
}
exports.GeneralUtils = GeneralUtils;
//# sourceMappingURL=GeneralUtils.js.map