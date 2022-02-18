import {InstructionShortcut} from "../utility/instructions/InstructionShortcut";
import {ColourType} from "../utility/SECD/ColourType";
import {LispASTVisitor} from "./LispASTVisitor"

export enum Position{
    Only,
    Left,
    Right,
    Cond
}

export abstract class Node {
    get colour(): ColourType {
        throw new Error("Method not implemented.")
    }

    set colour(value: ColourType) {
        throw new Error("Method not implemented.")
    }

    get mouseOver(): boolean {
        return false
    }

    set mouseOver(value: boolean) {
        throw new Error("Method not implemented.")
    }

    protected _colour: ColourType
    protected _mouseOver: boolean

    constructor() {
        this._colour = ColourType.None
        this._mouseOver = false
    }

    public abstract print(): string;

    public abstract loadVariable(variable: string, node: InnerNode): void

    public abstract notifyUpdate(pos: Position, node: InnerNode): void

    public abstract accept(visitor: LispASTVisitor): void

    public abstract update(node: InnerNode): void

    public abstract setColour(colour: ColourType): void
}


export class TopNode extends Node{
    node: InnerNode
    functions: Array<InnerNode>

    constructor(node: InnerNode, functions: Array<InnerNode>) {
        super();
        this.node = node
        this.node.parent = this
        this.node.position = Position.Only
        this.functions = functions
        this.functions.forEach(func => {
            func.parent = this
            func.position = Position.Only
        })
    }

    public loadVariable(variable: string, node: InnerNode): void {

    }

    notifyUpdate(pos: Position, node: InnerNode) {
        this.node = new EndNode(this.node, node)
        this.node.parent = this
        this.node.position = Position.Only
    }

    public print(): string {
        return this.functions.map(func => func.print() + '\n').join("") + this.node.print()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onTopNode(this);
    }

    public update(node: InnerNode) {
        throw new Error("Method not implemented.")
    }

    public setColour(colour: ColourType) {
        this.node.setColour(colour)
    }
}

export abstract class InnerNode extends Node {
    get mouseOver(): boolean {
        return this._mouseOver;
    }

    set mouseOver(value: boolean) {
        this._mouseOver = value;
    }

    get colour(): ColourType {
        return this._colour;
    }

    set colour(value: ColourType) {
        this._colour = value;
    }

    set position(value: Position) {
        this._position = value;
    }

    get position(): Position {
        return this._position as Position;
    }

    protected _position?: Position// Possibly can be removed

    set parent(value: Node) {
        this._parent = value;
    }

    public _parent?: Node

    public print(): string {
        throw new Error("Method not implemented.");
    }

    protected constructor() {
        super()
        this._mouseOver = false
    }

    public clean(){
        this._colour = ColourType.None
    }

    public update(node: InnerNode) {
        if (this._position == null)
            this._position = Position.Only
        if (typeof this._parent != "undefined")
            this._parent.notifyUpdate(this._position, node)
    }

    public setMouseOver(over: boolean): void{
        this._mouseOver = over
        if(this.parent instanceof EndNode)
            this.parent.setMouseOver(over)
    }

    public setColour(colour: ColourType) {
        this._colour = colour
    }
}


export class MainNode extends InnerNode{
    node: InnerNode

    constructor(node: InnerNode) {
        super()
        this.node = node
        this.node.parent = this
        this.node.position = Position.Only
    }

    public print(): string {
        return this.node.print()
    }

    public clean() {
        this.node.clean()
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onMainNode(this)
    }

    loadVariable(variable: string, node: InnerNode) {
        this.node.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode): void {

    }

    public setColour(colour: ColourType) {
        this.node.setColour(colour)
    }
}


export class DefineNode extends InnerNode{
    name: string
    vars: InnerNode
    body: InnerNode

    constructor(name: string, vars: InnerNode, body: InnerNode) {
        super();
        this.name = name
        this.vars = vars
        this.vars.parent = this
        this.vars.position = Position.Left
        this.body = body
        this.body.parent = this
        this.body.position = Position.Right
    }

    public print(): string {
        return '(define ' + this.name + '(' + this.vars.print() + ')\n\t' + this.body.print() + ')\n'
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onDefineNode(this)
    }

    loadVariable(variable: string, node: InnerNode) {
        this.vars.loadVariable(variable, node)
        this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode): void {

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

    public print(): string {
        return "(if " + this.condition.print() + " " + this.left.print() + " " + this.right.print() + " "
    }

    loadVariable(variable: string, node: InnerNode) {
        this.condition.loadVariable(variable, node)
        this.left.loadVariable(variable, node)
        this.right.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        switch (pos) {
            case Position.Cond:
                this.condition = new EndNode(this.condition, node)
                this.condition.parent = this
                this.condition.position = Position.Cond
                break
            case Position.Left:
                this.left = new EndNode(this.left, node)
                this.left.parent = this
                this.left.position = Position.Left
                break
            case Position.Right:
                this.right = new EndNode(this.right, node)
                this.right.parent = this
                this.right.position = Position.Right
                break
        }
    }

    public clean() {
        super.clean();
        this.condition.clean()
        this.left.clean()
        this.right.clean()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onIfNode(this);
    }
}

export class UnaryExprNode extends InnerNode{
    expr: InnerNode
    operator: OperatorNode

    constructor(node: InnerNode, operator: OperatorNode) {
        super();
        this.expr = node
        this.expr.parent = this
        this.expr.position = Position.Only
        this.operator = operator
        this.operator.parent = this
        this.operator.position = Position.Only
    }

    public print(): string {
        return "(" + this.operator.print() + " " + this.expr.print() + ")"
    }

    public loadVariable(variable: string, node: InnerNode) {
        this.expr.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        this.expr = new EndNode(this.expr, node)
        this.expr.parent = this
        this.expr.position = Position.Only
    }

    public clean() {
        super.clean();
        this.expr.clean()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onUnaryExprNode(this);
    }
}

export class BinaryExprNode extends InnerNode{
    left: InnerNode
    right: InnerNode
    operator: OperatorNode

    constructor(node1: InnerNode, node2: InnerNode, operator: OperatorNode) {
        super();

        this.left = node1
        this.left.parent = this
        this.left.position = Position.Left
        this.right = node2
        this.right.parent = this
        this.right.position = Position.Right
        this.operator = operator
        this.operator.parent = this
        this.operator.position = Position.Only
    }

    public print(): string {
        return '(' + this.operator.print() + ' ' + this.left.print() + ' ' + this.right.print() + ')'
    }

    loadVariable(variable: string, node: InnerNode) {
        this.left.loadVariable(variable, node)
        this.right.loadVariable(variable, node)
    }

    public notifyUpdate(pos: Position, node: InnerNode) {
        switch (pos) {
            case Position.Left:
                this.left = new EndNode(this.left, node)
                this.left.parent = this
                this.left.position = Position.Left
                break
            case Position.Right:
                this.right = new EndNode(this.right, node)
                this.right.parent = this
                this.right.position = Position.Right
        }
    }

    public clean() {
        super.clean();
        this.left.clean()
        this.right.clean()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onBinaryExprNode(this)
    }
}


export class FuncNode extends InnerNode{
    func: InnerNode
    args: InnerNode

    constructor(func: InnerNode, args: InnerNode) {
        super();
        this.func = func
        this.func.parent = this
        this.func.position = Position.Left
        this.args = args
        this.args.parent = this
        this.args.position = Position.Right
    }

    public print(): string {
        return "(" + this.func.print() + " " + this.args.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        this.func.loadVariable(variable, node)
        this.args.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        switch (pos) {
            case Position.Left:
                if(typeof this._parent != "undefined" && typeof this._position != "undefined")
                    this._parent.notifyUpdate(this._position, node)
                break
            case Position.Right:
                this.args = new EndNode(this.args, node)
                this.args.parent = this
                this.args.position = Position.Right
                break
        }
    }

    public clean() {
        super.clean();
        this.func.clean()
        this.args.clean()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onFuncNode(this);
    }
}


export class LambdaNode extends InnerNode{
    vars: InnerNode
    body: InnerNode

    constructor(vars: InnerNode, body: InnerNode) {
        super();
        this.vars = vars
        this.vars.parent = this
        this.vars.position = Position.Left
        this.body = body
        this.body.parent = this
        this.body.position = Position.Right
    }

    public print(): string {
        return "(lambda (" + this.vars.print() + ")" + this.body.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        this.vars.loadVariable(variable, node)
        this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        switch (pos) {
            case Position.Left:
                this.vars = new EndNode(this.vars, node)
                this.vars.parent = this
                this.vars.position = Position.Left
                break
            case Position.Right:
                /*if(typeof this._parent != "undefined" && typeof this._position != "undefined")
                    this._parent.notifyUpdate(this._position, node)
                */
                this.body = new EndNode(this.body, node)
                this.body.parent = this
                this.body.position = Position.Right
                break
        }
    }

    public clean() {
        super.clean();
        this.vars.clean()
        this.body.clean()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLambdaNode(this);
    }
}

export class CompositeNode extends InnerNode{
    items: Array<InnerNode>

    constructor(items: Array<InnerNode>) {
        super();
        this.items = items
        this.items.forEach(item => {
            item.position = Position.Only
            item.parent = this
        })
    }

    public addItemBack(item: InnerNode){
        item.position = Position.Only
        item.parent = this
        this.items.push(item)
    }

    public addItemFront(item: InnerNode){
        item.position = Position.Only
        item.parent = this
        this.items.unshift(item)
    }

    public print(): string {
        if(this.items.length == 0)
            return ""
        return (this.items.map(item => item.print() + " ").reduce((acc, str) => {return acc += str})).slice(0, -1)
    }

    loadVariable(variable: string, node: InnerNode) {
        let acc: CompositeNode = new CompositeNode(Array())
        this.items.forEach(item =>{
            if (item instanceof VarNode) {
                if (item.variable == variable) {
                    return acc
                }
            }
            else if(item instanceof ValueNode && node instanceof ValueNode){
                if(item.value == node.value) {
                    return acc
                }
            }
            acc.addItemBack(item)
            return acc
        })
        if(typeof this._parent != "undefined" && typeof this._position != "undefined")
            this._parent.notifyUpdate(this._position, acc)
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public clean() {
        super.clean()
        this.items.forEach(item => item.colour = ColourType.None)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCompositeNode(this);
    }
}


export class VarNode extends InnerNode{
    variable: string

    constructor(variable: string) {
        super();
        this.variable = variable
    }

    public print(): string {
        return this.variable
    }

    loadVariable(variable: string, node: InnerNode) {
        if(this.variable == variable)
            this.update(node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onVarNode(this);
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

    public print(): string {
        return this.value.toString()
    }

    loadVariable(variable: string, node: InnerNode) {

    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onValueNode(this);
    }
}


export class StringNode extends InnerNode{
    str: string

    constructor(str: string) {
        super();
        this.str = str
    }

    public print(): string {
        return "\"" + this.str + "\""
    }

    loadVariable(variable: string, node: InnerNode) {

    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onStringNode(this);
    }
}


export class OperatorNode extends InnerNode{
    operator: InstructionShortcut

    constructor(operator: InstructionShortcut) {
        super();
        this.operator = operator
    }

    public print(): string {
        return InstructionShortcut[this.operator]
    }

    loadVariable(variable: string, node: InnerNode) {

    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onOperatorNode(this);
    }
}


export class ListNode extends InnerNode{
    items: CompositeNode

    constructor(arr: Array<InnerNode>) {
        super();
        this.items = new CompositeNode(arr)
    }

    public print(): string {
        return "(" + this.items.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {

    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onListNode(this);
    }
}


export class LetNode extends InnerNode {
    names: InnerNode
    second: InnerNode
    body: InnerNode

    constructor(names: InnerNode, second: InnerNode, body: InnerNode) {
        super();
        this.names = names
        this.names.parent = this
        this.names.position = Position.Only
        this.second = second
        this.second.parent = this
        this.second.position = Position.Only
        this.body = body
        this.body.parent = this
        this.body.position = Position.Only
    }

    public print(): string {
        return "(let" + "(" + this.names.print() + ")\n(" + this.second.print() + ")\n" + this.body.print() + ")"
    }

    public clean() {
        super.clean();
        this.names.clean()
        this.second.clean()
        this.body.clean()
    }

    loadVariable(variable: string, node: InnerNode) {
        this.names.loadVariable(variable, node)
        this.second.loadVariable(variable, node)
        this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLetNode(this);
    }
}


export class CallNode extends InnerNode{
    body: InnerNode

    constructor(body: InnerNode) {
        super();
        this.body = body
        this.body.parent = this
        this.body.position = Position.Only
    }

    public print(): string {
        return this.body.print()
    }

    public clean() {
        super.clean();
        this.body.clean()
    }

    loadVariable(variable: string, node: InnerNode) {
        this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCallNode(this);
    }
}


export class EndNode extends InnerNode{
    next: InnerNode
    reduced: InnerNode

    constructor(next: InnerNode, reduced: InnerNode) {
        super();
        this.next = next
        this.next.parent = this
        this.next.position = Position.Left
        this.reduced = reduced
        this.reduced.parent = this
        this.reduced.position = Position.Right
    }

    loadVariable(variable: string, node: InnerNode) {
        this.reduced.loadVariable(variable, node)
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        if(typeof this._parent != "undefined" && typeof this._position != "undefined")
            this._parent.notifyUpdate(this._position, node)
    }

    public print(): string {
        return this.next.print()
    }

    public clean() {
        super.clean();
        this.next.clean()
        this.reduced.clean()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onEndNode(this);
    }

    public setMouseOver(over: boolean): void {
        this.reduced.mouseOver = over
        this.next.mouseOver = over
    }
}