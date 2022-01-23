import {InstructionShortcut} from "../utility/instructions/InstructionShortcut";
import {ColourType} from "../utility/SECD/ColourType";
import {LispASTVisitor} from "./LispASTVisitor"

export enum Position{
    Only,
    Left,
    Right,
    Cond
}

export enum PrintCall{
    Static,
    Dynamic
}

export abstract class Node{
    constructor() {

    }

    public abstract print(call: PrintCall): string;
    
    public abstract notifyUpdate(pos: Position, node: InnerNode): void

    public abstract accept(visitor: LispASTVisitor): void
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

    notifyUpdate(pos: Position, node: InnerNode) {
        this.node = new EndNode(this.node, node)
        this.node.parent = this
        this.node.position = Position.Only
    }

    public print(call: PrintCall): string {
        return this.functions.map(func => func.print(call) + '\n').join("") + this.node.print(call)
    }

    clone(): Node {
        return new TopNode(this.node.clone(), this.functions)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onTopNode(this);
    }
}

export abstract class InnerNode extends Node {
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

    protected _position?: Position
    private _colour: ColourType

    set parent(value: Node) {
        this._parent = value;
    }

    public _parent?: Node

    public print(call: PrintCall): string {
        throw new Error("Method not implemented.");
    }

    protected constructor() {
        super();
        this._colour = ColourType.None
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

    //public abstract loadVariable(variable: string, node: InnerNode): void;

    public abstract clone(): InnerNode;
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

    public print(call: PrintCall): string {
        return '(define ' + this.name + '(' + this.vars.print(call) + ')\n\t' + this.body.print(call) + ')\n'
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onDefineNode(this)
    }

    clone(): InnerNode {
        return new DefineNode(this.name, this.vars, this.body)
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

    public print(call: PrintCall): string {
        return "(if " + this.condition.print(call) + " " + this.left.print(call) + " " + this.right.print(call) + " "
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
/*
    loadVariable(variable: string, node: InnerNode) {
        this.condition.loadVariable(variable, node)
        this.left.loadVariable(variable, node)
        this.right.loadVariable(variable, node)
    }*/

    public clone(): InnerNode {
        return new IfNode(this.condition.clone(), this.left.clone(), this.right.clone())
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
    shortcut: InstructionShortcut

    constructor(node: InnerNode, shortcut: InstructionShortcut) {
        super();
        this.expr = node
        this.expr.parent = this
        this.expr.position = Position.Only
        this.shortcut = shortcut
    }

    public print(call: PrintCall): string {
        return "(" + InstructionShortcut[this.shortcut] + " " + this.expr.print(call) + ")"
    }

    notifyUpdate(pos: Position, node: InnerNode) {
        this.expr = new EndNode(this.expr, node)
        this.expr.parent = this
        this.expr.position = Position.Only
    }
/*
    public loadVariable(variable: string, node: InnerNode) {
        this.expr.loadVariable(variable, node)
    }*/

    public clone(): InnerNode {
        return new UnaryExprNode(this.expr.clone(), this.shortcut)
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

    public print(call: PrintCall): string {
        return '(' + InstructionShortcut[this.operator] + ' ' + this.left.print(call) + ' ' + this.right.print(call) + ')'
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
/*
    loadVariable(variable: string, node: InnerNode) {
        this.left.loadVariable(variable, node)
        this.right.loadVariable(variable, node)
    }*/

    public clone(): InnerNode {
        return new BinaryExprNode(this.left.clone(), this.right.clone(), this.operator)
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

    public print(call: PrintCall): string {
        return "(" + this.func.print(call) + " " + this.args.print(call) + ")"
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
/*
    loadVariable(variable: string, node: InnerNode) {
        this.func.loadVariable(variable, node)
        this.args.loadVariable(variable, node)
    }*/

    public clone(): InnerNode {
        return new FuncNode(this.func.clone(), this.args.clone())
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

    public print(call: PrintCall): string {
        return "(lambda (" + this.vars.print(call) + ")" + this.body.print(call) + ")"
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
/*
    loadVariable(variable: string, node: InnerNode) {
        this.vars.loadVariable(variable, node)
        this.body.loadVariable(variable, node)
    }*/

    public clone(): InnerNode {
        return new LambdaNode(this.vars.clone(), this.body.clone())
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
    }

    public addItem(item: InnerNode){
        this.items.push(item)
    }

    public print(call: PrintCall): string {
        if(this.items.length == 0)
            return ""
        return (this.items.map(item => item.print(call) + " ").reduce((acc, str) => {return acc += str})).slice(0, -1)
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }
/*
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
            acc.addItem(item)
            return acc
        })
        if(typeof this._parent != "undefined" && typeof this._position != "undefined")
            this._parent.notifyUpdate(this._position, acc)
    }*/

    public clone(): InnerNode {
        let arr = Array()
        arr.push(this.items.map(node => node.clone()))
        return new CompositeNode(arr)
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

    public print(call: PrintCall): string {
        return this.variable
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }
/*
    loadVariable(variable: string, node: InnerNode) {
        if(this.variable == variable)
            this.update(node)
    }*/

    public clone(): InnerNode {
        return new VarNode(this.variable)
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

    public print(call: PrintCall): string {
        return this.value.toString()
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }
/*
    loadVariable(variable: string, node: InnerNode) {
    }*/

    public clone(): InnerNode {
        return new ValueNode(this.value)
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

    public print(call: PrintCall): string {
        return "\"" + this.str + "\""
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }
/*
    loadVariable(variable: string, node: InnerNode) {
    }*/

    public clone(): InnerNode {
        return new StringNode(this.str)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onStringNode(this);
    }
}


export class ListNode extends InnerNode{
    items: CompositeNode

    constructor(arr: Array<InnerNode>) {
        super();
        this.items = new CompositeNode(arr)
    }

    public print(call: PrintCall): string {
        return "(" + this.items.print(call) + ")"
    }

    notifyUpdate(pos: Position, node: InnerNode) {

    }
/*
    loadVariable(variable: string, node: InnerNode) {
    }*/

    public clone(): InnerNode {
        return new ListNode(Array()/*this.items*/)//TODO
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onListNode(this);
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

    clone(): InnerNode {
        return new EndNode(this.next, this.reduced)
    }
/*
    loadVariable(variable: string, node: InnerNode) {
        this.reduced.loadVariable(variable, node)
    }*/

    notifyUpdate(pos: Position, node: InnerNode) {
        if(typeof this._parent != "undefined" && typeof this._position != "undefined")
            this._parent.notifyUpdate(this._position, node)
    }

    public print(call: PrintCall): string {
        switch (call) {
            case PrintCall.Static:
                return this.next.print(call)
            case PrintCall.Dynamic:
                return this.reduced.print(call)
        }
    }

    public clean() {
        super.clean();
        this.next.clean()
        this.reduced.clean()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onEndNode(this);
    }
}