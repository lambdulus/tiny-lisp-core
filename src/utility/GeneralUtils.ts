import {DefineNode, EndNode, FuncNode, InnerNode, LambdaNode, LetNode, VarNode } from ".."

export class GeneralUtils {
    public static getFunctionName(node: InnerNode): string {//TODO look if everything is used
        if (node instanceof FuncNode) {
            return (node as FuncNode).func.print()
        } else if (node instanceof LetNode) {
            return ((node as LetNode).body as FuncNode).func.print()
        } else if (node instanceof LambdaNode) {
            console.log("NEJAKY DEBUG VYPIS", node.parent, node)
            let parent = node.parent
            if(parent instanceof EndNode){
                if(parent.next instanceof VarNode)
                    return parent.next.print()
                return ((parent.parent as LetNode).body as FuncNode).func.print()
            }
            return ((parent as LetNode).body as FuncNode).func.print()
        }
        else if(node instanceof DefineNode){
            return node.name
        }
        return ""
    }
}