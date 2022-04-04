"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class GeneralUtils {
    static getFunctionName(node) {
        if (node instanceof __1.FuncNode) {
            return node.func().print();
        }
        else if (node instanceof __1.LetNode) {
            if (node.body() instanceof __1.ReduceNode)
                return node.body().next().func().print();
            return node.body().func().print();
        }
        else if (node instanceof __1.LambdaNode) {
            console.log("NEJAKY DEBUG VYPIS", node.parent, node);
            let parent = node.parent;
            let resNode;
            if (parent instanceof __1.ReduceNode) {
                if (parent.next() instanceof __1.VarNode)
                    return parent.next().print();
                resNode = parent.parent.variable();
            }
            else
                resNode = parent.variable();
            if (resNode instanceof __1.ReduceNode)
                return resNode.next().print();
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