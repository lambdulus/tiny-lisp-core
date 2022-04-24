"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class GeneralUtils {
    /**
     * Returns placeholder node based on the node
     * @param node
     */
    static getFunctionName(node) {
        if (node instanceof __1.FuncNode) {
            return node.func().print();
        }
        else if (node instanceof __1.LetNode) {
            if (node.body() instanceof __1.ReduceNode)
                return node.body().original().func().print();
            return node.body().func().print();
        }
        else if (node instanceof __1.LambdaNode) {
            console.log("NEJAKY DEBUG VYPIS", node.parent, node);
            let parent = node.parent;
            let resNode;
            if (parent instanceof __1.ReduceNode) {
                if (parent.original() instanceof __1.VarNode)
                    return parent.original().print();
                resNode = parent.parent.variable();
            }
            else
                resNode = parent.variable();
            if (resNode instanceof __1.ReduceNode)
                return resNode.original().print();
            return resNode.print();
        }
        else if (node instanceof __1.DefineNode) {
            return node.name;
        }
        return "";
    }
}
exports.GeneralUtils = GeneralUtils;
//# sourceMappingURL=GeneralUtils.js.map