import { InstructionShortcut } from "../SECD/instructions/InstructionShortcut";
import { ColourType } from "../SECD/ColourType";
import { LispASTVisitor } from "./LispASTVisitor";
export declare abstract class Node {
    get colour(): ColourType;
    set colour(value: ColourType);
    protected _colour: ColourType;
    protected _nodes: Array<InnerNode>;
    constructor();
    /**
     * Pretty prints the node for debugging purposes
     */
    abstract print(): string;
    /**
     * Creates ReduceNode from its subtree and its updated node
     * @param pos - position of the node being updated
     * @param node - updated node
     * @param returning - the update is triggered by returning from the function
     */
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    /**
     * Implements visitor pattern
     * @param visitor
     */
    abstract accept(visitor: LispASTVisitor): void;
    /**
     * Update this node by a node
     * @param node - updated node
     * @param returning  - the update is triggered by returning from the function
     */
    abstract update(node: InnerNode, returning: boolean): void;
    /**
     * Set the colour of the node
     * @param colour - new colour
     */
    abstract setColour(colour: ColourType): void;
    /**
     * Set all colours in tree to None
     */
    clean(): void;
    /**
     * Create ReduceNode from a subtree and updated value
     * @param original - original subtree
     * @param reduced - reduced subtree
     * @param parent - parent of the new ReduceNode
     * @param pos - position of the original node in the parent node
     * @protected
     */
    protected createReduceNode(original: InnerNode, reduced: InnerNode, parent: Node, pos: number): ReduceNode;
    /**
     * Assign a node as a subtree of a parent node
     * @param node - node to assign
     * @param parent - assign to this node
     * @param pos - position of the assigned node
     * @protected
     */
    protected assignNode(node: InnerNode, parent: Node, pos: number): InnerNode;
    /**
     * Change subnode of this node
     * @param node - new node
     * @param pos - pos of the node to be changed
     */
    setNode(node: InnerNode, pos: number): void;
}
/**
 * Top node of the AST
 */
export declare class TopNode extends Node {
    topLevelExprs: Array<InnerNode>;
    constructor(functions: Array<InnerNode>);
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    update(node: InnerNode, returning: boolean): void;
    setColour(colour: ColourType): void;
}
/**
 * Non top node of the AST
 */
export declare abstract class InnerNode extends Node {
    get colour(): ColourType;
    set colour(value: ColourType);
    set position(value: number);
    get position(): number;
    protected _position: number;
    set parent(value: Node);
    get parent(): Node;
    _parent?: Node;
    print(): string;
    protected constructor();
    hasParent(): boolean;
    abstract isValue(): boolean;
    update(node: InnerNode, returning: boolean): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    setColour(colour: ColourType): void;
    clone(): InnerNode;
    removeReduction(): void;
}
export declare abstract class LeafNode extends InnerNode {
    isValue(): boolean;
}
export declare class MainNode extends InnerNode {
    node: InnerNode;
    constructor(node: InnerNode);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    setColour(colour: ColourType): void;
    isValue(): boolean;
}
export declare class DefineNode extends InnerNode {
    name: string;
    isMacro: boolean;
    vars(): InnerNode;
    body(): InnerNode;
    constructor(name: string, vars: InnerNode, body: InnerNode, isMarco?: boolean);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    isValue(): boolean;
}
export declare class MacroNode extends InnerNode {
    code: Array<InnerNode>;
    constructor(code: InnerNode);
    accept(visitor: LispASTVisitor): void;
    isValue(): boolean;
    push(code: InnerNode): void;
    toString(): string;
}
export declare class IfNode extends InnerNode {
    condition(): InnerNode;
    left(): InnerNode;
    right(): InnerNode;
    constructor(condition: InnerNode, node1: InnerNode, node2: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    removeReduction(): void;
    accept(visitor: LispASTVisitor): void;
    clone(): IfNode;
    isValue(): boolean;
}
export declare class UnaryExprNode extends InnerNode {
    operator(): OperatorNode;
    expr(): InnerNode;
    constructor(operator: OperatorNode, node: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): UnaryExprNode;
    isValue(): boolean;
}
export declare class BinaryExprNode extends InnerNode {
    operator(): InnerNode;
    left(): InnerNode;
    right(): InnerNode;
    constructor(node1: InnerNode, node2: InnerNode, operator: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): BinaryExprNode;
    isValue(): boolean;
}
export declare class ApplicationNode extends InnerNode {
    func(): InnerNode;
    args(): InnerNode;
    constructor(func: InnerNode, args: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    accept(visitor: LispASTVisitor): void;
    clone(): ApplicationNode;
    isValue(): boolean;
}
export declare class LambdaNode extends InnerNode {
    vars(): InnerNode;
    body(): InnerNode;
    constructor(vars: InnerNode, body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): LambdaNode;
    isValue(): boolean;
}
export declare class CompositeNode extends InnerNode {
    items(): Array<InnerNode>;
    constructor(items: Array<InnerNode>);
    addItemBack(item: InnerNode): void;
    addItemFront(item: InnerNode): void;
    popFront(): void;
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): CompositeNode;
    isValue(): boolean;
}
export declare class VarNode extends LeafNode {
    variable: string;
    constructor(variable: string);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
}
export declare class ValueNode extends LeafNode {
    value: number;
    constructor(value: number | boolean);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isValue(): boolean;
    clone(): ValueNode;
}
export declare class StringNode extends LeafNode {
    str: string;
    constructor(str: string);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    add(str: string): void;
}
export declare class OperatorNode extends LeafNode {
    operator: InstructionShortcut;
    constructor(operator: InstructionShortcut);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    clone(): OperatorNode;
    setColour(colour: ColourType): void;
}
export declare class LetNode extends InnerNode {
    bindings(): InnerNode;
    body(): InnerNode;
    recursive: boolean;
    constructor(bindings: InnerNode, body: InnerNode, recursive?: boolean);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): LetNode;
    isValue(): boolean;
}
export declare class CallNode extends InnerNode {
    body(): InnerNode;
    constructor(body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): CallNode;
    isValue(): boolean;
}
export declare class BeginNode extends InnerNode {
    items(): CompositeNode;
    constructor(items: CompositeNode);
    accept(visitor: LispASTVisitor): void;
    isValue(): boolean;
}
export declare class QuoteNode extends InnerNode {
    isBack: boolean;
    node(): InnerNode;
    constructor(node: InnerNode, isBack?: boolean);
    accept(visitor: LispASTVisitor): void;
    isValue(): boolean;
    print(): string;
}
export declare class CommaNode extends InnerNode {
    node(): InnerNode;
    constructor(node: InnerNode);
    accept(visitor: LispASTVisitor): void;
    isValue(): boolean;
    print(): string;
}
export declare class BindNode extends InnerNode {
    variable(): VarNode;
    binded(): InnerNode;
    constructor(variable: InnerNode, binded: InnerNode);
    loadVariable(variable: string, node: InnerNode): boolean;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isValue(): boolean;
}
export declare class ReduceNode extends InnerNode {
    original(): InnerNode;
    reduced(): InnerNode;
    constructor(next: InnerNode, reduced: InnerNode);
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isValue(): boolean;
    setColour(colour: ColourType): void;
}
export declare class NullNode extends InnerNode {
    constructor();
    isValue(): boolean;
    accept(visitor: LispASTVisitor): void;
    print(): string;
    setColour(colour: ColourType): void;
    update(node: InnerNode, returning: boolean): void;
}
