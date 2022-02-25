import { InstructionShortcut } from "../utility/instructions/InstructionShortcut";
import { ColourType } from "../utility/SECD/ColourType";
import { LispASTVisitor } from "./LispASTVisitor";
export declare enum Position {
    Only = 0,
    Left = 1,
    Right = 2,
    Cond = 3
}
export declare abstract class Node {
    get colour(): ColourType;
    set colour(value: ColourType);
    get mouseOver(): boolean;
    set mouseOver(value: boolean);
    protected _colour: ColourType;
    protected _mouseOver: boolean;
    constructor();
    abstract print(): string;
    abstract loadVariable(variable: string, node: InnerNode): void;
    abstract notifyUpdate(pos: Position, node: InnerNode): void;
    abstract accept(visitor: LispASTVisitor): void;
    abstract update(node: InnerNode): void;
    abstract setColour(colour: ColourType): void;
}
export declare class TopNode extends Node {
    node: InnerNode;
    functions: Array<InnerNode>;
    constructor(node: InnerNode, functions: Array<InnerNode>);
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    print(): string;
    accept(visitor: LispASTVisitor): void;
    update(node: InnerNode): void;
    setColour(colour: ColourType): void;
}
export declare abstract class InnerNode extends Node {
    get mouseOver(): boolean;
    set mouseOver(value: boolean);
    get colour(): ColourType;
    set colour(value: ColourType);
    set position(value: Position);
    get position(): Position;
    protected _position?: Position;
    set parent(value: Node);
    _parent?: Node;
    print(): string;
    protected constructor();
    clean(): void;
    update(node: InnerNode): void;
    setMouseOver(over: boolean): void;
    setColour(colour: ColourType): void;
}
export declare class MainNode extends InnerNode {
    node: InnerNode;
    constructor(node: InnerNode);
    print(): string;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    setColour(colour: ColourType): void;
}
export declare class DefineNode extends InnerNode {
    name: string;
    vars: InnerNode;
    body: InnerNode;
    constructor(name: string, vars: InnerNode, body: InnerNode);
    print(): string;
    accept(visitor: LispASTVisitor): void;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
}
export declare class IfNode extends InnerNode {
    condition: InnerNode;
    left: InnerNode;
    right: InnerNode;
    constructor(condition: InnerNode, node1: InnerNode, node2: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class UnaryExprNode extends InnerNode {
    expr: InnerNode;
    operator: OperatorNode;
    constructor(node: InnerNode, operator: OperatorNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class BinaryExprNode extends InnerNode {
    left: InnerNode;
    right: InnerNode;
    operator: OperatorNode;
    constructor(node1: InnerNode, node2: InnerNode, operator: OperatorNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class FuncNode extends InnerNode {
    func: InnerNode;
    args: InnerNode;
    constructor(func: InnerNode, args: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class LambdaNode extends InnerNode {
    vars: InnerNode;
    body: InnerNode;
    constructor(vars: InnerNode, body: InnerNode);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class CompositeNode extends InnerNode {
    items: Array<InnerNode>;
    constructor(items: Array<InnerNode>);
    addItemBack(item: InnerNode): void;
    addItemFront(item: InnerNode): void;
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class VarNode extends InnerNode {
    variable: string;
    constructor(variable: string);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class ValueNode extends InnerNode {
    value: number;
    constructor(value: number | boolean);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class StringNode extends InnerNode {
    str: string;
    constructor(str: string);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class OperatorNode extends InnerNode {
    operator: InstructionShortcut;
    constructor(operator: InstructionShortcut);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class ListNode extends InnerNode {
    items: CompositeNode;
    constructor(arr: Array<InnerNode>);
    print(): string;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class LetNode extends InnerNode {
    names: InnerNode;
    second: InnerNode;
    body: InnerNode;
    constructor(names: InnerNode, second: InnerNode, body: InnerNode);
    print(): string;
    clean(): void;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class CallNode extends InnerNode {
    body: InnerNode;
    constructor(body: InnerNode);
    print(): string;
    clean(): void;
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    accept(visitor: LispASTVisitor): void;
}
export declare class EndNode extends InnerNode {
    next: InnerNode;
    reduced: InnerNode;
    constructor(next: InnerNode, reduced: InnerNode);
    loadVariable(variable: string, node: InnerNode): void;
    notifyUpdate(pos: Position, node: InnerNode): void;
    print(): string;
    clean(): void;
    accept(visitor: LispASTVisitor): void;
    setMouseOver(over: boolean): void;
}
