import {InstructionShortcut} from "../utility/instructions/InstructionShortcut";

enum Position{
    Only,
    Left,
    Right,
    Cond
}

export abstract class Node{
    constructor() {

    }

    public abstract toString(): string;
    
    public abstract notifyUpdate(pos: Position, node: InnerNode)
}

export class TopNode extends Node{
    node: InnerNode

    constructor(node: InnerNode) {
        super();
        this.node = node
        this.node.parent = this
        this.node.position = Position.Only
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        this.node = node
        this.node.parent = this
        this.node.position = Position.Only
    }

    public toString(): string {
        return this.node.toString()
    }
}

export abstract class InnerNode extends Node{
    set position(value: Position) {
        this._position = value;
    }
    protected _position?: Position
    set parent(value: Node) {
        this._parent = value;
    }
    public _parent?: Node
    public toString(): string {
        throw new Error("Method not implemented.");
    }
    protected constructor() {
        super();
    }

    public update(node: InnerNode){
        this._parent.notifyUpdate(this._position, node)
    }
}

export class IfNode extends InnerNode{
    condition: InnerNode
    left: InnerNode
    right: InnerNode

    constructor(condition: InnerNode, node1: InnerNode, node2: InnerNode) {
        super();
        this.condition = condition
        this.condition.parent = this
        this.condition.position = Position.Cond
        this.left = node1
        this.left.parent = this
        this.left.position = Position.Left
        this.right = node2
        this.right.parent = this
        this.right.position = Position.Right
    }

    public toString(): string {
        return "(if " + this.condition.toString() + " " + this.left.toString() + " " + this.right.toString() + " "
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        switch (pos) {
            case Position.Cond:
                this.condition = node
                this.condition.parent = this
                this.condition.position = Position.Cond
                break
            case Position.Left:
                this.left = node
                this.left.parent = this
                this.left.position = Position.Left
                break
            case Position.Right:
                this.right = node
                this.right.parent = this
                this.right.position = Position.Right
                break
        }
    }
}

export class UnaryExprNode extends InnerNode{
    expr: InnerNode
    shortcut: InstructionShortcut

    constructor(node: InnerNode, shortcut: InstructionShortcut) {
        super();
        this.expr = node
        this.shortcut = shortcut
    }

    public toString(): string {
        return this.expr.toString()
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        this.expr = node
    }
}

export class BinaryExprNode extends InnerNode{
    left: InnerNode
    right: InnerNode
    operator: InstructionShortcut

    constructor(node1: InnerNode, node2: InnerNode, operator: InstructionShortcut) {
        super();

        this.left = node1
        this.left.parent = this
        this.left.position = Position.Left
        this.right = node2
        this.right.parent = this
        this.right.position = Position.Right
        this.operator = operator
    }

    public toString(): string {
        return '(' + InstructionShortcut[this.operator] + ' ' + this.left.toString() + ' ' + this.right.toString() + ')'
    }

    public notifyUpdate(pos: Position, node: InnerNode) {
        switch (pos) {
            case Position.Left:
                this.left = node
                this.left.parent = this
                this.left.position = Position.Left
                break
            case Position.Right:
                this.right = node
                this.right.parent = this
                this.right.position = Position.Right
        }
    }

}

export class LambdaNode extends InnerNode{
    vars: Array<InnerNode>
    body: InnerNode
    args: Array<InnerNode>

    constructor() {
        super();
    }

    public toString(): string {
        return
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

}


export class VarNode extends InnerNode{
    constructor(variable: string) {
        super();
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }
}


export class ValueNode extends InnerNode{
    value: number

    constructor(value: number | boolean) {
        super();
        if(typeof(value) == "boolean"){
            if(value)
                this.value = 1
            else
                this.value = 0
        }
        else
            this.value = value
    }

    public toString(): string {
        return this.value.toString()
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }
}