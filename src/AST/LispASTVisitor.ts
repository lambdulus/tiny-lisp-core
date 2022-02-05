import {
    BinaryExprNode,
    CompositeNode, DefineNode, EndNode,
    FuncNode,
    IfNode,
    LambdaNode, ListNode, MainNode, OperatorNode, StringNode,
    TopNode,
    UnaryExprNode,
    ValueNode,
    VarNode
} from "./AST";


export abstract class LispASTVisitor {
    onTopNode(node: TopNode): void {}
    onMainNode(node: MainNode): void {}
    onDefineNode(node: DefineNode): void {}
    onIfNode(node: IfNode): void {}
    onUnaryExprNode(node: UnaryExprNode): void {}
    onBinaryExprNode(node: BinaryExprNode): void {}
    onFuncNode(node: FuncNode): void {}
    onLambdaNode(node: LambdaNode): void {}
    onCompositeNode(node: CompositeNode): void {}
    onVarNode(node: VarNode): void {}
    onValueNode(node: ValueNode): void {}
    onStringNode(node: StringNode): void {}
    onOperatorNode(node: OperatorNode): void {}
    onListNode(node: ListNode): void {}
    onEndNode(node: EndNode): void {}
}