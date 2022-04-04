import { InstructionShortcut } from "../utility/instructions/InstructionShortcut";
import { ColourType } from "../utility/SECD/ColourType";
import { LispASTVisitor } from "./LispASTVisitor";
export declare abstract class Node {
    get colour(): ColourType;
    set colour(value: ColourType);
    protected _colour: ColourType;
    protected _nodes: Array<InnerNode>;
    constructor();
    abstract print(): string;
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    abstract accept(visitor: LispASTVisitor): void;
    abstract update(node: InnerNode, returning: boolean): void;
    abstract setColour(colour: ColourType): void;
    clean(): void;
    protected createReduceNode(next: InnerNode, reduced: InnerNode, parent: Node, pos: number): ReduceNode;
    protected assignNode(node: InnerNode, parent: Node, pos: number): InnerNode;
    setNode(node: InnerNode, pos: number): void;
}
export declare class TopNode extends Node {
    node: InnerNode;
    functions: Array<InnerNode>;
    constructor(node: InnerNode, functions: Array<InnerNode>);
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    update(node: InnerNode, returning: boolean): void;
    setColour(colour: ColourType): void;
}
export declare abstract class InnerNode extends Node {
    get returned(): boolean;
    set returned(value: boolean);
    get colour(): ColourType;
    set colour(value: ColourType);
    set position(value: number);
    get position(): number;
    protected _position: number;
    set parent(value: Node);
    get parent(): Node;
    _parent?: Node;
    _returned: boolean;
    print(): string;
    protected constructor();
    hasParent(): boolean;
    abstract isLeaf(): boolean;
    abstract deapCopy(): InnerNode;
    update(node: InnerNode, returning: boolean): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    setColour(colour: ColourType): void;
    clone(): InnerNode;
    removeReduction(): void;
}
export declare abstract class LeafNode extends InnerNode {
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class MainNode extends InnerNode {
    node: InnerNode;
    constructor(node: InnerNode);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    setColour(colour: ColourType): void;
    isLeaf(): boolean;
    deapCopy(): InnerNode;
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
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class MacroNode extends InnerNode {
    code: Array<InnerNode>;
    constructor(code: InnerNode);
    accept(visitor: LispASTVisitor): void;
    deapCopy(): InnerNode;
    isLeaf(): boolean;
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
    accept(visitor: LispASTVisitor): void;
    clone(): IfNode;
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class UnaryExprNode extends InnerNode {
    operator(): OperatorNode;
    expr(): InnerNode;
    constructor(operator: OperatorNode, node: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): UnaryExprNode;
    isLeaf(): boolean;
    deapCopy(): InnerNode;
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
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class FuncNode extends InnerNode {
    func(): InnerNode;
    args(): InnerNode;
    constructor(func: InnerNode, args: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    accept(visitor: LispASTVisitor): void;
    clone(): FuncNode;
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class LambdaNode extends InnerNode {
    vars(): InnerNode;
    body(): InnerNode;
    constructor(vars: InnerNode, body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    isLeaf(): boolean;
    deapCopy(): InnerNode;
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
    isLeaf(): boolean;
    setColour(colour: ColourType): void;
    removeReduction(): void;
    deapCopy(): InnerNode;
}
export declare class VarNode extends LeafNode {
    variable: string;
    constructor(variable: string);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    deapCopy(): InnerNode;
}
export declare class ValueNode extends LeafNode {
    value: number;
    constructor(value: number | boolean);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isLeaf(): boolean;
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
export declare class ListNode extends LeafNode {
    items(): InnerNode;
    constructor(arr: Array<InnerNode>);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isLeaf(): boolean;
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
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class CallNode extends InnerNode {
    body(): InnerNode;
    constructor(body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    accept(visitor: LispASTVisitor): void;
    clone(): CallNode;
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class BeginNode extends InnerNode {
    items(): CompositeNode;
    constructor(items: CompositeNode);
    accept(visitor: LispASTVisitor): void;
    deapCopy(): InnerNode;
    isLeaf(): boolean;
}
export declare class QuoteNode extends InnerNode {
    node(): InnerNode;
    constructor(node: InnerNode);
    accept(visitor: LispASTVisitor): void;
    deapCopy(): InnerNode;
    isLeaf(): boolean;
    print(): string;
}
export declare class CommaNode extends InnerNode {
    node(): InnerNode;
    constructor(node: InnerNode);
    accept(visitor: LispASTVisitor): void;
    deapCopy(): InnerNode;
    isLeaf(): boolean;
    print(): string;
}
export declare class BindNode extends InnerNode {
    variable(): VarNode;
    binded(): InnerNode;
    constructor(variable: InnerNode, binded: InnerNode);
    loadVariable(variable: string, node: InnerNode): boolean;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isLeaf(): boolean;
    deapCopy(): InnerNode;
}
export declare class ReduceNode extends InnerNode {
    next(): InnerNode;
    reduced(): InnerNode;
    constructor(next: InnerNode, reduced: InnerNode);
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode, returning: boolean): void;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isLeaf(): boolean;
    setColour(colour: ColourType): void;
    deapCopy(): InnerNode;
}
export declare class NullNode extends InnerNode {
    constructor();
    isLeaf(): boolean;
    accept(visitor: LispASTVisitor): void;
    print(): string;
    setColour(colour: ColourType): void;
    update(node: InnerNode, returning: boolean): void;
    deapCopy(): InnerNode;
}
