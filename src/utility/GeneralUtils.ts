import {DefineNode, ReduceNode, FuncNode, InnerNode, LambdaNode, LetNode, VarNode, BindNode } from ".."

export class GeneralUtils {
    public static getFunctionName(node: InnerNode): string {//TODO look if everything is used
        if (node instanceof FuncNode) {
            return (node as FuncNode).func().print()
        } else if (node instanceof LetNode) {
            if((node as LetNode).body() instanceof ReduceNode)
                return (((node as LetNode).body() as ReduceNode).original() as FuncNode).func().print()
            return ((node as LetNode).body() as FuncNode).func().print()
        } else if (node instanceof LambdaNode) {
            console.log("NEJAKY DEBUG VYPIS", node.parent, node)
            let parent = node.parent
            let resNode
            if(parent instanceof ReduceNode){
                if(parent.original() instanceof VarNode)
                    return parent.original().print()
                resNode = (parent.parent as BindNode).variable()
            }
            else 
                resNode = (parent as BindNode).variable()
            if(resNode instanceof ReduceNode)
                return (resNode.original() as VarNode).print()
            return resNode.print()
        }
        else if(node instanceof DefineNode){
            return node.name
        }
        return ""
    }
}