import {DefineNode, ReduceNode, ApplicationNode, InnerNode, LambdaNode, LetNode, VarNode, BindNode } from ".."

export class GeneralUtils {

    /**
     * Returns placeholder name based on a node
     * @param node
     */

    public static getFunctionName(node: InnerNode): string {
        if (node instanceof LambdaNode) {//Letrec expressions]
            let parent = node.parent
            let resNode
            //get the variable part of the binding
            if(parent instanceof ReduceNode){
                if(parent.original() instanceof VarNode)
                    return parent.original().print()
                resNode = (parent.parent as BindNode).variable()
            }
            else 
                resNode = (parent as BindNode).variable()
            //print the variable part of the binding
            if(resNode instanceof ReduceNode)
                return (resNode.original() as VarNode).print()
            return resNode.print()
        }
        else if(node instanceof DefineNode){//global functions and macros
            return node.name
        }
        return ""
    }
}