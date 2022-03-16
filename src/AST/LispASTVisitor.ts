import {
    BinaryExprNode, CallNode,
    CompositeNode, DefineNode, ReduceNode,
    FuncNode,
    IfNode, NullNode,
    LambdaNode, LetNode, ListNode, MainNode, OperatorNode, StringNode,
    TopNode,
    UnaryExprNode,
    ValueNode,
    VarNode,
    BeginNode,
    QuoteNode,
    CommaNode
} from "./AST";


export abstract class LispASTVisitor {
    onTopNode(node: TopNode): void {}
    onMainNode(node: MainNode): void {}
    onDefineNode(node: DefineNode): void {}
    onIfNode(node: IfNode): void {}
    onUnaryExprNode(node: UnaryExprNode): void {}
    onBinaryExprNode(node: BinaryExprNode): void {}
    onBeginNode(node: BeginNode): void {}
    onFuncNode(node: FuncNode): void {}
    onLambdaNode(node: LambdaNode): void {}
    onCompositeNode(node: CompositeNode): void {}
    onVarNode(node: VarNode): void {}
    onValueNode(node: ValueNode): void {}
    onStringNode(node: StringNode): void {}
    onOperatorNode(node: OperatorNode): void {}
    onListNode(node: ListNode): void {}
    onLetNode(node: LetNode): void {}
    onCallNode(node: CallNode): void {}
    onQuoteNode(node: QuoteNode): void {}
    onCommaNode(node: CommaNode): void {}
    onReduceNode(node: ReduceNode): void {}
    onNullNode(node: NullNode): void {}
}