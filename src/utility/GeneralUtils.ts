import {DefineNode, ReduceNode, FuncNode, InnerNode, LambdaNode, LetNode, VarNode } from ".."

export class GeneralUtils {
    public static getFunctionName(node: InnerNode): string {//TODO look if everything is used
        if (node instanceof FuncNode) {
            return (node as FuncNode).func().print()
        } else if (node instanceof LetNode) {
            if((node as LetNode).body() instanceof ReduceNode)
                return (((node as LetNode).body() as ReduceNode).next() as FuncNode).func().print()
            return ((node as LetNode).body() as FuncNode).func().print()
        } else if (node instanceof LambdaNode) {
            console.log("NEJAKY DEBUG VYPIS", node.parent, node)
            let parent = node.parent
            let resNode
            if(parent instanceof ReduceNode){
                if(parent.next() instanceof VarNode)
                    return parent.next().print()
                resNode = (parent.parent as LetNode).body()
            }
            else 
                resNode = (parent as LetNode).body()
            if(resNode instanceof ReduceNode)
                return (resNode.next() as FuncNode).func().print()
            return ((parent as LetNode).body() as FuncNode).func().print()
        }
        else if(node instanceof DefineNode){
            return node.name
        }
        return ""
    }
}