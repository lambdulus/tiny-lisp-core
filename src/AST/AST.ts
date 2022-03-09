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

    protected _colour: ColourType
    protected _nodes: Array<InnerNode>

    constructor() {
        this._colour = ColourType.None
        this._nodes = Array()
    }

    public abstract print(): string;

    public abstract notifyUpdate(pos: number, node: InnerNode): void

    public abstract accept(visitor: LispASTVisitor): void

    public abstract update(node: InnerNode): void

    public abstract setColour(colour: ColourType): void

    public clean(){
        this._colour = ColourType.None
        this._nodes.forEach(node => node.clean())
    }

    protected createEndNode(next: InnerNode, reduced: InnerNode, parent: Node, pos: number): EndNode{
        let index = parent._nodes.indexOf(next)
        let res = (next instanceof EndNode) ? new EndNode(next.next, reduced) : new EndNode(next, reduced)
        res.parent = parent
        res.position = pos
        parent._nodes[index] = res
        return res
    }
    
    protected assignNode(node: InnerNode, parent: Node, pos: number): InnerNode{
        node.parent = parent
        node.position = pos
        parent._nodes.push(node)
        return node
    }
}


export class TopNode extends Node{
    node: InnerNode
    functions: Array<InnerNode>

    constructor(node: InnerNode, functions: Array<InnerNode>) {
        super();
        this.node = this.assignNode(node, this, 0)
        let i = 0
        this.functions = functions.map(
            func => this.assignNode(func, this, i ++)
        )}

    notifyUpdate(pos: number, node: InnerNode) {
        this.node = this.createEndNode(this.node, node, this, 0)
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

    get parent(): Node {
        return typeof(this._parent) != "undefined" ? this._parent : new NullNode();
    }

    public _parent?: Node

    public print(): string {
        throw new Error("Method not implemented.");
    }

    protected constructor() {
        super()
        this._position = 0
    }

    public hasParent(): boolean{
        if(this._parent)
            return true
        return false
    }
    
    public abstract isList(): boolean

    public update(node: InnerNode) {
        if (!(this.parent instanceof NullNode))
            this.parent.notifyUpdate(this._position, node)
    }

    public loadVariable(variable: string, node: InnerNode): boolean {
        return false
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
        this.node = this.assignNode(node, this, 0)
    }

    public print(): string {
        return this.node.print()
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onMainNode(this)
    }

    loadVariable(variable: string, node: InnerNode): boolean{
        return this.node.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode): void {

    }

    public setColour(colour: ColourType) {
        this.node.setColour(colour)
    }

    isList(): boolean {
        return false;
    }
}


export class DefineNode extends InnerNode{
    name: string
    vars: InnerNode
    body: InnerNode

    constructor(name: string, vars: InnerNode, body: InnerNode) {
        super();
        this.name = name
        this.vars = this.assignNode(vars, this, 0)
        this.body = this.assignNode(body, this, 1)
    }

    public print(): string {
        return '(define ' + this.name + '(' + this.vars.print() + ')\n\t' + this.body.print() + ')\n'
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onDefineNode(this)
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode): void {

    }

    isList(): boolean {
        return false;
    }
}

export class IfNode extends InnerNode{
    condition: InnerNode
    left: InnerNode
    right: InnerNode

    constructor(condition: InnerNode, node1: InnerNode, node2: InnerNode) {
        super();
        this.condition = this.assignNode(condition, this, 0)
        this.left = this.assignNode(node1, this, 1)
        this.right = this.assignNode(node2, this, 2)
    }

    public print(): string {
        return "(if " + this.condition.print() + " " + this.left.print() + " " + this.right.print() + " "
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        if(this.condition.loadVariable(variable, node))
            return true;
        if(this.left.loadVariable(variable, node))
            return true;
        return this.right.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        switch (pos) {
            case 0:
                this.condition = this.createEndNode(this.condition, node, this, 0)
                break
            case 1:
                this.left = this.createEndNode(this.left, node, this, 1)
                break
            case 2:
                this.right = this.createEndNode(this.right, node, this, 2)
                break
        }
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onIfNode(this);
    }

    public clone(): IfNode{
        return new IfNode(this.condition, this.left, this.right)
    }

    isList(): boolean {
        return false;
    }
}

export class UnaryExprNode extends InnerNode{
    expr: InnerNode
    operator: OperatorNode

    constructor(operator: OperatorNode, node: InnerNode) {
        super();
        this.operator = this.assignNode(operator, this, 0) as OperatorNode
        this.expr = this.assignNode(node, this, 1)
    }

    public print(): string {
        return "(" + this.operator.print() + " " + this.expr.print() + ")"
    }

    public loadVariable(variable: string, node: InnerNode): boolean {
        return this.expr.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        this.expr = this.createEndNode(this.expr, node, this, 0)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onUnaryExprNode(this);
    }

    public clone(): UnaryExprNode{
        return new UnaryExprNode(this.operator, this.expr)
    }

    isList(): boolean {
        return false;
    }
}

export class BinaryExprNode extends InnerNode{
    left: InnerNode
    right: InnerNode
    operator: InnerNode

    constructor(node1: InnerNode, node2: InnerNode, operator: InnerNode) {
        super();
        this.operator = this.assignNode(operator, this, 0)
        this.left = this.assignNode(node1, this, 1)
        this.right = this.assignNode(node2, this, 2)
    }

    public print(): string {
        return '(' + this.operator.print() + ' ' + this.left.print() + ' ' + this.right.print() + ')'
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        if(this.operator.loadVariable(variable, node))
            return true
        if(this.right.loadVariable(variable, node))
            return true
        return this.left.loadVariable(variable, node)
    }

    public notifyUpdate(pos: number, node: InnerNode) {
        switch (pos) {
            case 0:
                this.operator = this.createEndNode(this.operator, node, this, 0)
                break
            case 1:
                this.left = this.createEndNode(this.left, node, this, 1)
                break
            case 2:
                this.right = this.createEndNode(this.right, node, this, 2)
        }
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onBinaryExprNode(this)
    }

    public clone(): BinaryExprNode{
        return new BinaryExprNode(this.operator, this.left, this.right)
    }

    isList(): boolean {
        return false;
    }
}


export class FuncNode extends InnerNode{
    func: InnerNode
    args: InnerNode

    constructor(func: InnerNode, args: InnerNode) {
        super();
        this.func = this.assignNode(func, this, 0)
        this.args = this.assignNode(args, this, 1)
    }

    public print(): string {
        return "(" + this.func.print() + " " + this.args.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        if(this.func.loadVariable(variable, node))
            return true;
        return this.args.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        if(pos == 1) {
            this.args = this.createEndNode(this.args, node, this, 1)
        }
        else
            if(!(this.parent instanceof NullNode))
                this.parent.notifyUpdate(this._position, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onFuncNode(this);
    }

    public clone(): FuncNode{
        return new FuncNode(this.func, this.args)
    }

    isList(): boolean {
        return false;
    }
}


export class LambdaNode extends InnerNode{
    vars: InnerNode
    body: InnerNode

    constructor(vars: InnerNode, body: InnerNode) {
        super();
        this.vars = this.assignNode(vars, this, 0)
        this.body = this.assignNode(body, this, 1)
    }

    public print(): string {
        return "(lambda (" + this.vars.print() + ")" + this.body.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        switch (pos) {
            case 0:
                this.vars = this.createEndNode(this.vars, node, this, 0)
                break
            case 1:
                this.body = this.createEndNode(this.body, node, this, 1)
                break
        }
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLambdaNode(this);
    }

    public clone(): LambdaNode{
        return new LambdaNode(this.vars, this.body)
    }

    isList(): boolean {
        return false;
    }
}

export class CompositeNode extends InnerNode{
    items: Array<InnerNode>

    constructor(items: Array<InnerNode>) {
        super();
        let pos = 0
        this.items = items.map(item => this.assignNode(item, this, pos ++))
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

    loadVariable(variable: string, node: InnerNode): boolean {
        let acc: CompositeNode = new CompositeNode(Array())
        let changed = false
        this.items.forEach(item =>{
            changed = item.loadVariable(variable, node)
            if (item instanceof VarNode) {
                if (item.variable == variable) {
                    changed = true
                    item = item.parent as InnerNode
                }
            }
            else if(item instanceof ValueNode && node instanceof ValueNode){
                if(item.value == node.value) {
                    changed = true
                    item = item.parent as InnerNode
                }
            }
            else 
                changed = true
            acc.addItemBack(item)
            return acc
        })
        if(changed)
            if(!(this.parent instanceof NullNode))
                this.parent.notifyUpdate(this.position, acc)
        return changed
            
    }

    notifyUpdate(pos: number, node: InnerNode) {
        this.items[pos] = this.createEndNode(this.items[pos], node, this, pos)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCompositeNode(this);
    }

    public clone(): CompositeNode{
        return new CompositeNode(this.items.map(item => item))
    }

    isList(): boolean {
        return false;
    }
    
    setColour(colour: ColourType) {
        this.items.forEach(item => item.setColour(colour))
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
        if(this.variable == variable) {
            this.update(node)
            return true
        }
        return false
    }

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onVarNode(this);
    }

    isList(): boolean {
        return true;
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

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onValueNode(this);
    }

    public isList(): boolean {
        return true
    }

    public clone(): ValueNode{
        return new ValueNode(this.value)
    }
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

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onStringNode(this);
    }

    public isList(): boolean {
        return true
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

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onOperatorNode(this);
    }

    public clone(): OperatorNode{
        return new OperatorNode(this.operator)
    }

    public isList(): boolean {
        return true
    }
}


export class ListNode extends InnerNode{
    items: CompositeNode

    constructor(arr: Array<InnerNode>) {
        super();
        this.items = this.assignNode(new CompositeNode(arr), this, 0) as CompositeNode
    }

    public print(): string {
        return "(" + this.items.print() + ")"
    }

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onListNode(this);
    }

    public isList(): boolean {
        return true
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
        this.names = this.assignNode(names, this, 0)
        this.second = this.assignNode(second, this, 1)
        this.body = this.assignNode(body, this, 2)
    }

    public print(): string {
        return "(let" + "(" + this.names.print() + ")\n(" + this.second.print() + ")\n" + this.body.print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        if(this.names.loadVariable(variable, node))
            return true
        if(this.second.loadVariable(variable, node))
            return true
        return this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLetNode(this);
    }

    public clone(): LetNode{
        return new LetNode(this.names, this.second, this.body)
    }

    public isList(): boolean {
        return false
    }
}


export class CallNode extends InnerNode{
    body: InnerNode

    constructor(body: InnerNode) {
        super();
        this.body = this.assignNode(body, this, 0)
    }

    public print(): string {
        return this.body.print()
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.body.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {

    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCallNode(this);
    }

    public clone(): CallNode{
        return new CallNode(this.body)
    }

    public isList(): boolean {
        return false
    }
}


export class EndNode extends InnerNode{
    next: InnerNode
    reduced: InnerNode

    constructor(next: InnerNode, reduced: InnerNode) {
        super();
        this.next = this.assignNode(next, this, 0)
        this.reduced = this.assignNode(reduced, this, 1)
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.reduced.loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode) {
        if(!(this.parent instanceof NullNode))
            this.parent.notifyUpdate(this._position, node)
    }

    public print(): string {
        return this.reduced.print()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onEndNode(this);
    }

    public isList(): boolean {
        return false
    }

    public setColour(colour: ColourType) {
        this.next.setColour(colour)
    }
}

export class NullNode extends Node{
    accept(visitor: LispASTVisitor): void {
        visitor.onNullNode(this)
    }

    notifyUpdate(pos: number, node: InnerNode): void {
    }

    print(): string {
        return "";
    }

    setColour(colour: ColourType): void {
        
    }

    update(node: InnerNode): void {
    }
    
}