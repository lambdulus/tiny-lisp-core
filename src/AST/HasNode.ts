import {Node} from "./AST";


export interface HasNode{
    setNode(node: Node): void
    getNode(): Node
}