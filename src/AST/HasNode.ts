import {InnerNode, Node} from "./AST";


export interface HasNode{
    setNode(node: InnerNode): void
    getNode(): InnerNode
}