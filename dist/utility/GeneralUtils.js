"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralUtils = void 0;
const __1 = require("..");
class GeneralUtils {
    /**
     * Returns placeholder name based on a node
     * @param node
     */
    static getFunctionName(node) {
        if (node instanceof __1.LambdaNode) { //Letrec expressions]
            let parent = node.parent;
            let resNode;
            //get the variable part of the binding
            if (parent instanceof __1.ReduceNode) {
                if (parent.original() instanceof __1.VarNode)
                    return parent.original().print();
                resNode = parent.parent.variable();
            }
            else
                resNode = parent.variable();
            //print the variable part of the binding
            if (resNode instanceof __1.ReduceNode)
                return resNode.original().print();
            return resNode.print();
        }
        else if (node instanceof __1.DefineNode) { //global functions and macros
            return node.name;
        }
        return "";
    }
}
exports.GeneralUtils = GeneralUtils;
//# sourceMappingURL=GeneralUtils.js.map