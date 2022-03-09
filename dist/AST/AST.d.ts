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
    abstract notifyUpdate(pos: number, node: InnerNode): void;
    abstract accept(visitor: LispASTVisitor): void;
    abstract update(node: InnerNode): void;
    abstract setColour(colour: ColourType): void;
    clean(): void;
    protected createEndNode(next: InnerNode, reduced: InnerNode, parent: Node, pos: number): EndNode;
    protected assignNode(node: InnerNode, parent: Node, pos: number): InnerNode;
}
export declare class TopNode extends Node {
    node: InnerNode;
    functions: Array<InnerNode>;
    constructor(node: InnerNode, functions: Array<InnerNode>);
    notifyUpdate(pos: number, node: InnerNode): void;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    update(node: InnerNode): void;
    setColour(colour: ColourType): void;
}
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
    abstract isList(): boolean;
    update(node: InnerNode): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    setColour(colour: ColourType): void;
    clone(): InnerNode;
    clearEndNode(): void;
}
export declare class MainNode extends InnerNode {
    node: InnerNode;
    constructor(node: InnerNode);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    setColour(colour: ColourType): void;
    isList(): boolean;
}
export declare class DefineNode extends InnerNode {
    name: string;
    vars: InnerNode;
    body: InnerNode;
    constructor(name: string, vars: InnerNode, body: InnerNode);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    isList(): boolean;
}
export declare class IfNode extends InnerNode {
    condition: InnerNode;
    left: InnerNode;
    right: InnerNode;
    constructor(condition: InnerNode, node1: InnerNode, node2: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): IfNode;
    isList(): boolean;
}
export declare class UnaryExprNode extends InnerNode {
    expr: InnerNode;
    operator: OperatorNode;
    constructor(operator: OperatorNode, node: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): UnaryExprNode;
    isList(): boolean;
}
export declare class BinaryExprNode extends InnerNode {
    left: InnerNode;
    right: InnerNode;
    operator: InnerNode;
    constructor(node1: InnerNode, node2: InnerNode, operator: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): BinaryExprNode;
    isList(): boolean;
}
export declare class FuncNode extends InnerNode {
    func: InnerNode;
    args: InnerNode;
    constructor(func: InnerNode, args: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): FuncNode;
    isList(): boolean;
}
export declare class LambdaNode extends InnerNode {
    vars: InnerNode;
    body: InnerNode;
    constructor(vars: InnerNode, body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): LambdaNode;
    isList(): boolean;
}
export declare class CompositeNode extends InnerNode {
    items: Array<InnerNode>;
    constructor(items: Array<InnerNode>);
    addItemBack(item: InnerNode): void;
    addItemFront(item: InnerNode): void;
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): CompositeNode;
    isList(): boolean;
}
export declare class VarNode extends InnerNode {
    variable: string;
    constructor(variable: string);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    isList(): boolean;
}
export declare class ValueNode extends InnerNode {
    value: number;
    constructor(value: number | boolean);
    print(): string;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    isList(): boolean;
    clone(): ValueNode;
}
export declare class StringNode extends InnerNode {
    str: string;
    constructor(str: string);
    print(): string;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    isList(): boolean;
}
export declare class OperatorNode extends InnerNode {
    operator: InstructionShortcut;
    constructor(operator: InstructionShortcut);
    print(): string;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): OperatorNode;
    isList(): boolean;
}
export declare class ListNode extends InnerNode {
    items: CompositeNode;
    constructor(arr: Array<InnerNode>);
    print(): string;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    isList(): boolean;
}
export declare class LetNode extends InnerNode {
    names: InnerNode;
    second: InnerNode;
    body: InnerNode;
    constructor(names: InnerNode, second: InnerNode, body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): LetNode;
    isList(): boolean;
}
export declare class CallNode extends InnerNode {
    body: InnerNode;
    constructor(body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
    clone(): CallNode;
    isList(): boolean;
}
export declare class EndNode extends InnerNode {
    next: InnerNode;
    reduced: InnerNode;
    constructor(next: InnerNode, reduced: InnerNode);
    loadVariable(variable: string, node: InnerNode): boolean;
    notifyUpdate(pos: number, node: InnerNode): void;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    isList(): boolean;
}
export declare class NullNode extends Node {
    accept(visitor: LispASTVisitor): void;
    notifyUpdate(pos: number, node: InnerNode): void;
    print(): string;
    setColour(colour: ColourType): void;
    update(node: InnerNode): void;
}
