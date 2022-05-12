import {
    BinaryExprNode, CallNode,
    CompositeNode, DefineNode, ReduceNode,
    ApplicationNode,
    IfNode, NullNode,
    LambdaNode, LetNode, MainNode, OperatorNode, StringNode,
    TopNode,
    UnaryExprNode,
    ValueNode,
    VarNode,
    BeginNode,
    QuoteNode,
    CommaNode,
    MacroNode,
    BindNode
} from "./AST";


export abstract class LispASTVisitor {
    onTopNode(node: TopNode): void {}
    onMainNode(node: MainNode): void {}
    onDefineNode(node: DefineNode): void {}
    onMacroNode(node: MacroNode): void {}
    onIfNode(node: IfNode): void {}
    onUnaryExprNode(node: UnaryExprNode): void {}
    onBinaryExprNode(node: BinaryExprNode): void {}
    onBeginNode(node: BeginNode): void {}
    onApplicationNode(node: ApplicationNode): void {}
    onLambdaNode(node: LambdaNode): void {}
    onCompositeNode(node: CompositeNode): void {}
    onVarNode(node: VarNode): void {}
    onValueNode(node: ValueNode): void {}
    onStringNode(node: StringNode): void {}
    onOperatorNode(node: OperatorNode): void {}
    onLetNode(node: LetNode): void {}
    onCallNode(node: CallNode): void {}
    onQuoteNode(node: QuoteNode): void {}
    onCommaNode(node: CommaNode): void {}
    onBindNode(node: BindNode): void {}
    onReduceNode(node: ReduceNode): void {}
    onNullNode(node: NullNode): void {}
}