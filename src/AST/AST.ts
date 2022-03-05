import {InstructionShortcut} from "../utility/instructions/InstructionShortcut";
import {ColourType} from "../utility/SECD/ColourType";
import {LispASTVisitor} from "./LispASTVisitor"


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
    protected _nodes: Array<InnerNode>

    constructor() {
        this._colour = ColourType.None
        this._mouseOver = false
        this._nodes = Array()
    }

    public abstract print(): string;

    public abstract loadVariable(variable: string, node: InnerNode): void

    public abstract notifyUpdate(pos: number, node: InnerNode): void

    public abstract accept(visitor: LispASTVisitor): void

    public abstract update(node: InnerNode): void

    public abstract setColour(colour: ColourType): void

    protected createEndNode(next: InnerNode, reduced: InnerNode): EndNode{
        if(next instanceof EndNode)
            return new EndNode(next.next.clone(), reduced)
        return new EndNode(next.clone(), reduced)
    }
}


export class TopNode extends Node{
    node: InnerNode
    functions: Array<InnerNode>

    constructor(node: InnerNode, functions: Array<InnerNode>) {
        super();
        this.node = node
        this.node.parent = this
        this.node.position = 0
        this.functions = functions
        let i = 0
        this.functions.forEach(func => {
            func.parent = this
            func.position = ++ i
        })
        this._nodes.push(this.node)
        this.functions.forEach(func => this._nodes.push(func))
    }

    public loadVariable(variable: string, node: InnerNode): void {

    }

    notifyUpdate(pos: number, node: InnerNode) {
        this.node = new EndNode(this.node, node)
        this.node.parent = this
        this.node.position = 0
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

    set position(value: number) {
        this._position = value;
    }

    get position(): number {
        return this._position;
    }

    protected _position: number// TODO Necessary for bin operators and ifs

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
        this._position = 0
    }

    public clean(){
        this._colour = ColourType.None
        this._nodes.forEach(node => node.clean())
    }

    public update(node: InnerNode) {
        if (typeof this._parent != "undefined")
            this._parent.notifyUpdate(this._position, node)
    }

    public setMouseOver(over: boolean): void{
        this._mouseOver = over
        let node = this.parent
        do{
            if(node instanceof InnerNode) {
                if (node instanceof EndNode)
                    if (node.mouseOver == over)
                        node.setMouseOver(over)
                node = node.parent
            }
            else
                return
        }
        while(typeof(node) != "undefined")
    }

    public setColour(colour: ColourType) {
        this._colour = colour
    }

    public clone(): InnerNode{
        return this
    }

    public clearEndNode(): void{
        this._nodes.forEach(node => {
            if(node instanceof EndNode)
                node = node.next
            node.clearEndNode()
        })
    }
}


export class MainNode extends InnerNode{
    node: InnerNode

    constructor(node: InnerNode) {
        super()
        this.node = node
        this.node.parent = this
        this.node.position = 0
        this._nodes.push(this.node)
    }

    public print(): string {
        return this.node.print()
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onMainNode(this)
    }

    loadVariable(variable: string, node: InnerNode) {
        this.node.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode): void {

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
        this.vars.position = 0
        this.body = body
        this.body.parent = this
        this.body.position = 1
        this._nodes.push(this.vars)
        this._nodes.push(this.body)
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

    notifyUpdate(pos: number, node: InnerNode): void {

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
        this.condition.position = 0
        this.left = node1
        this.left.parent = this
        this.left.position = 1
        this.right = node2
        this.right.parent = this
        this.right.position = 2
        this._nodes.push(this.condition)
        this._nodes.push(this.left)
        this._nodes.push(this.right)
    }

    public print(): string {
        return "(if " + this.condition.print() + " " + this.left.print() + " " + this.right.print() + " "
    }

    loadVariable(variable: string, node: InnerNode) {
        this.condition.loadVariable(variable, node)
        this.left.loadVariable(variable, node)
        this.right.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        switch (pos) {
            case 0:
                this.condition = this.createEndNode(this.condition, node)
                this.condition.parent = this
                this.condition.position = 0
                break
            case 1:
                this.left = this.createEndNode(this.left, node)
                this.left.parent = this
                this.left.position = 1
                break
            case 2:
                this.right = this.createEndNode(this.right, node)
                this.right.parent = this
                this.right.position = 2
                break
        }
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onIfNode(this);
    }

    public clone(): IfNode{
        return new IfNode(this.condition, this.left, this.right)
    }
}

export class UnaryExprNode extends InnerNode{
    expr: InnerNode
    operator: OperatorNode

    constructor(operator: OperatorNode, node: InnerNode) {
        super();
        this.operator = operator
        this.operator.parent = this
        this.operator.position = 0
        this.expr = node
        this.expr.parent = this
        this.expr.position = 1
        this._nodes.push(this.operator)
        this._nodes.push(this.expr)
    }

    public print(): string {
        return "(" + this.operator.print() + " " + this.expr.print() + ")"
    }

    public loadVariable(variable: string, node: InnerNode) {
        this.expr.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        this.expr = this.createEndNode(this.expr, node)
        this.expr.parent = this
        this.expr.position = 0
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onUnaryExprNode(this);
    }

    public clone(): UnaryExprNode{
        return new UnaryExprNode(this.operator, this.expr)
    }
}

export class BinaryExprNode extends InnerNode{
    left: InnerNode
    right: InnerNode
    operator: InnerNode

    constructor(node1: InnerNode, node2: InnerNode, operator: InnerNode) {
        super();
        this.operator = operator
        this.operator.parent = this
        this.operator.position = 0
        this.left = node1
        this.left.parent = this
        this.left.position = 1
        this.right = node2
        this.right.parent = this
        this.right.position = 2
        this._nodes.push(this.operator)
        this._nodes.push(this.left)
        this._nodes.push(this.right)
    }

    public print(): string {
        return '(' + this.operator.print() + ' ' + this.left.print() + ' ' + this.right.print() + ')'
    }

    loadVariable(variable: string, node: InnerNode) {
        this.operator.loadVariable(variable, node)
        this.left.loadVariable(variable, node)
        this.right.loadVariable(variable, node)
    }

    public notifyUpdate(pos: number, node: InnerNode) {
        switch (pos) {
            case 0:
                this.operator = this.createEndNode(this.operator, node)
                this.operator.parent = this
                this.operator.position = 0
                break
            case 1:
                this.left = this.createEndNode(this.left, node)
                this.left.parent = this
                this.left.position = 1
                break
            case 2:
                this.right = this.createEndNode(this.right, node)
                this.right.parent = this
                this.right.position = 2
        }
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onBinaryExprNode(this)
    }

    public clone(): BinaryExprNode{
        return new BinaryExprNode(this.operator, this.left, this.right)
    }
}


export class FuncNode extends InnerNode{
    func: InnerNode
    args: InnerNode

    constructor(func: InnerNode, args: InnerNode) {
        super();
        this.func = func
        this.func.parent = this
        this.func.position = 0
        this.args = args
        this.args.parent = this
        this.args.position = 1
        this._nodes.push(this.func)
        this._nodes.push(this.args)
    }

    public print(): string {
        return "(" + this.func.print() + " " + this.args.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        this.func.loadVariable(variable, node)
        this.args.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        if(pos == 1) {
            this.args = this.createEndNode(this.args, node)
            this.args.parent = this
            this.args.position = 1
        }
        else
            if(typeof this._parent != "undefined")
                this._parent.notifyUpdate(this._position, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onFuncNode(this);
    }

    public clone(): FuncNode{
        return new FuncNode(this.args, this.func)
    }
}


export class LambdaNode extends InnerNode{
    vars: InnerNode
    body: InnerNode

    constructor(vars: InnerNode, body: InnerNode) {
        super();
        this.vars = vars
        this.vars.parent = this
        this.vars.position = 0
        this.body = body
        this.body.parent = this
        this.body.position = 1
        this._nodes.push(this.vars)
        this._nodes.push(this.body)
    }

    public print(): string {
        return "(lambda (" + this.vars.print() + ")" + this.body.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        this.vars.loadVariable(variable, node)
        this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        switch (pos) {
            case 0:
                this.vars = this.createEndNode(this.vars, node)
                this.vars.parent = this
                this.vars.position = 0
                break
            case 1:
                this.body = this.createEndNode(this.body, node)
                this.body.parent = this
                this.body.position = 1
                break
        }
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLambdaNode(this);
    }

    public clone(): LambdaNode{
        return new LambdaNode(this.vars, this.body)
    }
}

export class CompositeNode extends InnerNode{
    items: Array<InnerNode>

    constructor(items: Array<InnerNode>) {
        super();
        this.items = items
        let pos = 0
        this.items.forEach(item => {
            item.position = pos ++
            item.parent = this
        })
        this._nodes.forEach(item => this._nodes.push(item))
    }

    public addItemBack(item: InnerNode){
        item.position = this.items.length
        item.parent = this
        this.items.push(item)
        this._nodes.push(item)
    }

    public addItemFront(item: InnerNode){
        item.position = 0
        item.parent = this
        this.items.forEach(item => item.position ++)
        this.items.unshift(item)
        this._nodes.unshift(item)
    }

    public print(): string {
        if(this.items.length == 0)
            return ""
        return (this.items.map(item => item.print() + " ").reduce((acc, str) => {return acc += str})).slice(0, -1)
    }

    loadVariable(variable: string, node: InnerNode) {
        let acc: CompositeNode = new CompositeNode(Array())
        let changed = false
        this.items.forEach(item =>{
            item.loadVariable(variable, node)
            if (item instanceof VarNode) {
                if (item.variable == variable) {
                    acc.addItemBack(node)
                    changed = true
                }
                else 
                    acc.addItemBack(item)
            }
            else if(item instanceof ValueNode && node instanceof ValueNode){
                if(item.value == node.value) {
                    acc.addItemBack(node)
                    changed = true
                }
                else 
                    acc.addItemBack(item)
            }
            else 
                acc.addItemBack(item)
            return acc
        })
        if(changed)
            if(typeof this._parent != "undefined")
                this._parent.notifyUpdate(this._position, acc)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        this.items[pos] = this.createEndNode(this.items[pos], node)
        this.items[pos].parent = this
        this.items[pos].position = pos;
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCompositeNode(this);
    }

    public clone(): CompositeNode{
        return new CompositeNode(this.items.map(item => item))
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

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onVarNode(this);
    }
/*
    public clone(): VarNode{
        return new VarNode(this.variable)
    }*/
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

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onValueNode(this);
    }
/*
    public clone(): ValueNode{
        return new ValueNode(this.value)
    }*/
}


export class StringNode extends InnerNode{//TODO maybe do not support
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

    notifyUpdate(pos: number, node: InnerNode) {

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

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onOperatorNode(this);
    }

    public clone(): OperatorNode{
        return new OperatorNode(this.operator)
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

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onListNode(this);
    }

    /*public clone(): ListNode{

    }*///TODO
}


export class LetNode extends InnerNode {
    names: InnerNode
    second: InnerNode
    body: InnerNode

    constructor(names: InnerNode, second: InnerNode, body: InnerNode) {
        super();
        this.names = names
        this.names.parent = this
        this.names.position = 0
        this.second = second
        this.second.parent = this
        this.second.position = 1
        this.body = body
        this.body.parent = this
        this.body.position = 2
        this._nodes.push(this.names)
        this._nodes.push(this.second)
        this._nodes.push(this.body)
    }

    public print(): string {
        return "(let" + "(" + this.names.print() + ")\n(" + this.second.print() + ")\n" + this.body.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        this.names.loadVariable(variable, node)
        this.second.loadVariable(variable, node)
        this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLetNode(this);
    }

    public clone(): LetNode{
        return new LetNode(this.names, this.second, this.body)
    }
}


export class CallNode extends InnerNode{
    body: InnerNode

    constructor(body: InnerNode) {
        super();
        this.body = body
        this.body.parent = this
        this.body.position = 0
        this._nodes.push(this.body)
    }

    public print(): string {
        return this.body.print()
    }

    loadVariable(variable: string, node: InnerNode) {
        this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCallNode(this);
    }

    public clone(): CallNode{
        return new CallNode(this.body)
    }
}


export class EndNode extends InnerNode{
    next: InnerNode
    reduced: InnerNode

    constructor(next: InnerNode, reduced: InnerNode) {
        super();
        this.next = next
        this.next.parent = this
        this.next.position = 0
        this.reduced = reduced
        this.reduced.parent = this
        this.reduced.position = 1
        this._nodes.push(this.next)
        this._nodes.push(this.reduced)
    }

    loadVariable(variable: string, node: InnerNode) {
        this.reduced.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        if(typeof this._parent != "undefined")
            this._parent.notifyUpdate(this._position, node)
    }

    public print(): string {
        return this.reduced.print()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onEndNode(this);
    }

    public setMouseOver(over: boolean): void {
        console.log("END NODE in mouseOver", over)
        this.reduced.mouseOver = over
        this.next.mouseOver = over
    }
}