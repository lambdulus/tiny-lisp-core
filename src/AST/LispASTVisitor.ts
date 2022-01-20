import {
    BinaryExprNode,
    CompositeNode, EndNode,
    FuncNode,
    IfNode,
    LambdaNode,
    TopNode,
    UnaryExprNode,
    ValueNode,
    VarNode
} from "./AST";


export abstract class LispASTVisitor {
    onTopNode(node: TopNode): void {}
    onIfNode(node: IfNode): void {}
    onUnaryExprNode(node: UnaryExprNode): void {}
    onBinaryExprNode(node: BinaryExprNode): void {}
    onFuncNode(node: FuncNode): void {}
    onLambdaNode(node: LambdaNode): void {}
    onCompositeNode(node: CompositeNode): void {}
    onVarNode(node: VarNode): void {}
    onValueNode(node: ValueNode): void {}
    onEndNode(node: EndNode): void {}
}