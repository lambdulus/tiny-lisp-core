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

    public notifyUpdate(pos: number, node: InnerNode, returning: boolean): void {
        this.createReduceNode(this._nodes[pos], node, this, pos)
    }

    public abstract accept(visitor: LispASTVisitor): void

    public abstract update(node: InnerNode, returning: boolean): void

    public abstract setColour(colour: ColourType): void

    public clean(){
        this._colour = ColourType.None
        this._nodes.forEach(node => node.clean())
    }
    
    public removeReduction(){
        this._nodes.forEach(node => {
            if(node instanceof ReduceNode) {
                this._nodes[node.position] = node.next()
                node.next().position = node.position
                node.next().parent = this
            }
        })
        this._nodes.forEach(node => node.removeReduction())
    }

    protected createReduceNode(next: InnerNode, reduced: InnerNode, parent: Node, pos: number): ReduceNode{//Maybe use pos instead of index
        let res = (next instanceof ReduceNode) ? new ReduceNode(next.next(), reduced) : new ReduceNode(next, reduced)
        res.parent = parent
        res.position = pos
        parent._nodes[pos] = res
        return res
    }
    
    protected assignNode(node: InnerNode, parent: Node, pos: number): InnerNode{
        node.parent = parent
        node.position = pos
        parent._nodes.push(node)
        return node
    }
    
    public setNode(node: InnerNode, pos: number): void{
        this._nodes[pos] = node
        this._nodes[pos].parent = this
        this._nodes[pos].position = pos
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
            func => this.assignNode(func, this, ++ i)
        )}

    notifyUpdate(pos: number, node: InnerNode, returning: boolean) {
        this.node = this.createReduceNode(this.node, node, this, 0)
    }

    public print(): string {
        return this.functions.map(func => func.print() + '\n').join("") + this.node.print()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onTopNode(this);
    }

    public update(node: InnerNode, returning: boolean) {
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
    
    public abstract isLeaf(): boolean
    
    public abstract deapCopy(): InnerNode

    public update(node: InnerNode, returning: boolean) {
        if (!(this.parent instanceof NullNode))
            this.parent.notifyUpdate(this._position, node, returning)
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
}

export abstract class LeafNode extends InnerNode{
    
    
    isLeaf(): boolean {
        return true
    }
    
    deapCopy(): InnerNode {
        return this.clone()
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

    public setColour(colour: ColourType) {
        this.node.setColour(colour)
    }

    isLeaf(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new MainNode(this.node.deapCopy())
    }
}


export class DefineNode extends InnerNode{
    name: string
    isMacro: boolean

    vars(): InnerNode{
        return this._nodes[0]
    }

    body(): InnerNode{
        return this._nodes[1]
    }

    constructor(name: string, vars: InnerNode, body: InnerNode, isMarco = false) {
        super();
        this.name = name
        this.isMacro = isMarco
        this.assignNode(vars, this, 0)
        this.assignNode(body, this, 1)
    }

    public print(): string {
        return '(define' + (this.isMacro ? '-macro' : '') + ' ' + this.name + '(' + this.vars().print() + ')\n\t' + this.body().print() + ')\n'
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onDefineNode(this)
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.body().loadVariable(variable, node)
    }

    isLeaf(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new DefineNode(this.name, this.vars().deapCopy(), this.body().deapCopy())
    }
}

export class IfNode extends InnerNode{
    condition(): InnerNode{
        return this._nodes[0]
    }
    
    left(): InnerNode{
        return this._nodes[1]
    }
    
    right(): InnerNode{
        return this._nodes[2]
    }

    constructor(condition: InnerNode, node1: InnerNode, node2: InnerNode) {
        super();
        this.assignNode(condition, this, 0)
        this.assignNode(node1, this, 1)
        this.assignNode(node2, this, 2)
    }

    public print(): string {
        return "(if " + this.condition().print() + " " + this.left().print() + " " + this.right().print() + " "
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        if(this.condition().loadVariable(variable, node))
            return true;
        if(this.left().loadVariable(variable, node))
            return true;
        return this.right().loadVariable(variable, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onIfNode(this);
    }

    public clone(): IfNode{
        return new IfNode(this.condition(), this.left(), this.right())
    }

    isLeaf(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new IfNode(this.condition().deapCopy(), this.left().deapCopy(), this.right().deapCopy())
    }
}

export class UnaryExprNode extends InnerNode{
    operator(): OperatorNode{
        return this._nodes[0] as OperatorNode
    }
    
    expr(): InnerNode{
        return this._nodes[1]
    }

    constructor(operator: OperatorNode, node: InnerNode) {
        super();
        this.assignNode(operator, this, 0) as OperatorNode
        this.assignNode(node, this, 1)
    }

    public print(): string {
        return "(" + this.operator().print() + " " + this.expr().print() + ")"
    }

    public loadVariable(variable: string, node: InnerNode): boolean {
        return this.expr().loadVariable(variable, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onUnaryExprNode(this);
    }

    public clone(): UnaryExprNode{
        return new UnaryExprNode(this.operator(), this.expr())
    }

    isLeaf(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new UnaryExprNode(this.operator().deapCopy() as OperatorNode, this.expr().deapCopy())
    }
}

export class BinaryExprNode extends InnerNode{
    operator(): InnerNode{
        return this._nodes[0]
    }
    
    left(): InnerNode{
        return this._nodes[1]
    }
    
    right(): InnerNode{
        return this._nodes[2]
    }

    constructor(node1: InnerNode, node2: InnerNode, operator: InnerNode) {
        super();
        this.assignNode(operator, this, 0)
        this.assignNode(node1, this, 1)
        this.assignNode(node2, this, 2)
    }

    public print(): string {
        return '(' + this.operator().print() + ' ' + this.left().print() + ' ' + this.right().print() + ')'
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        if(this.operator().loadVariable(variable, node))
            return true
        if(this.right().loadVariable(variable, node))
            return true
        return this.left().loadVariable(variable, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onBinaryExprNode(this)
    }

    public clone(): BinaryExprNode{
        return new BinaryExprNode(this.left(), this.right(), this.operator())
    }

    isLeaf(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new BinaryExprNode(this.left().deapCopy(), this.right().deapCopy(), this.operator().deapCopy())
    }
}


export class FuncNode extends InnerNode{
    func(): InnerNode{
        return this._nodes[0]
    }

    args(): InnerNode{
        return this._nodes[1]
    }

    constructor(func: InnerNode, args: InnerNode) {
        super();
        this.assignNode(func, this, 0)
        this.assignNode(args, this, 1)
    }

    public print(): string {
        return "(" + this.func().print() + " " + this.args().print() + ")"
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        if(this.func().loadVariable(variable, node))
            return true;
        return this.args().loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode, returning: boolean) {
        if(returning){
            if(!(this.parent instanceof NullNode))
                this.parent.notifyUpdate(this._position, node, true)
        }
        else {
            this.createReduceNode(this._nodes[pos], node, this, pos)
        }
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onFuncNode(this);
    }

    public clone(): FuncNode{
        return new FuncNode(this.func(), this.args())
    }

    isLeaf(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new FuncNode(this.func().deapCopy(), this.args().deapCopy())
    }
}


export class LambdaNode extends InnerNode{
    vars(): InnerNode{
        return this._nodes[0]
    }
    
    body(): InnerNode{
        return this._nodes[1]
    }

    constructor(vars: InnerNode, body: InnerNode) {
        super();
        this.assignNode(vars, this, 0)
        this.assignNode(body, this, 1)
    }

    public print(): string {
        return "(lambda (" + this.vars().print() + ")" + this.body().print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.body().loadVariable(variable, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLambdaNode(this);
    }

    /*public clone(): LambdaNode{
        return new LambdaNode(this.vars, this.body)
    }*/

    isLeaf(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new LambdaNode(this.vars().deapCopy(), this.body().deapCopy())
    }
}

export class CompositeNode extends InnerNode{
    items(): Array<InnerNode>{
        return this._nodes
    }

    constructor(items: Array<InnerNode>) {
        super();
        let pos = 0
        items.map(item => this.assignNode(item, this, pos ++))
    }

    public addItemBack(item: InnerNode){
        item.position = this.items().length
        item.parent = this
        this._nodes.push(item)
    }

    public addItemFront(item: InnerNode){
        item.position = 0
        item.parent = this
        this._nodes.unshift(item)
    }
    
    public popFront(){
        this._nodes.shift()
        this._nodes.forEach(item => item.position --)
    }

    public print(): string {
        if(this.items().length == 0)
            return ""
        return (this.items().map(item => item.print() + " ").reduce((acc, str) => {return acc += str})).slice(0, -1)
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        let acc: CompositeNode = new CompositeNode(Array())
        let changed = false
        this.items().forEach(item =>{
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
                this.parent.notifyUpdate(this.position, acc, false)
        return changed
            
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCompositeNode(this);
    }

    public clone(): CompositeNode{
        return new CompositeNode(this.items().map(item => item))
    }

    isLeaf(): boolean {
        return false;
    }
    
    setColour(colour: ColourType) {
        this.items().forEach(item => item.setColour(colour))
    }

    public removeReduction(){
        super.removeReduction()
        let i = 0
        this.items().forEach(item => this.items()[i] = this._nodes[i ++])
    }

    deapCopy(): InnerNode {
        return new CompositeNode(this.items().map(item => item.deapCopy()))
    }
}


export class VarNode extends LeafNode{
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
            this.update(node, false)
            return true
        }
        return false
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onVarNode(this);
    }
/*
    public clone(): VarNode{
        return new VarNode(this.variable)
    }*/

    deapCopy(): InnerNode {
        return new VarNode(this.variable)
    }
}


export class ValueNode extends LeafNode{
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

    public accept(visitor: LispASTVisitor): void {
        visitor.onValueNode(this);
    }

    public isLeaf(): boolean {
        return true
    }

    public clone(): ValueNode{
        return new ValueNode(this.value)
    }
}


export class StringNode extends LeafNode{//TODO maybe do not support
    str: string

    constructor(str: string) {
        super();
        this.str = str
    }

    public print(): string {
        return "\"" + this.str + "\""
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onStringNode(this);
    }
}


export class OperatorNode extends LeafNode{
    operator: InstructionShortcut

    constructor(operator: InstructionShortcut) {
        super();
        this.operator = operator
    }

    public print(): string {
        return InstructionShortcut[this.operator]
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onOperatorNode(this);
    }

    public clone(): OperatorNode{
        return new OperatorNode(this.operator)
    }
}


export class ListNode extends LeafNode{
    items(): InnerNode{
        return this._nodes[0]
    }

    constructor(arr: Array<InnerNode>) {
        super();
        this.assignNode(new CompositeNode(arr), this, 0)
    }

    public print(): string {
        return "(" + this.items().print() + ")"
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onListNode(this);
    }

    public isLeaf(): boolean {
        return true
    }

    /*public clone(): ListNode{

    }*///TODO
}


export class LetNode extends InnerNode {
    names(): InnerNode{
        return this._nodes[0]
    }
    
    second(): InnerNode{
        return this._nodes[1]
    }
    
    body(): InnerNode{
        return this._nodes[2]
    }
    
    recursive: boolean

    constructor(names: InnerNode, second: InnerNode, body: InnerNode, recursive: boolean = false) {
        super();
        this.assignNode(names, this, 0)
        this.assignNode(second, this, 1)
        this.assignNode(body, this, 2)
        this.recursive = recursive
    }

    public print(): string {
        return "(let" + (this.recursive ? "rec" : "") + "(" + this.names().print() + ")\n(" + this.second().print() + ")\n" + this.body().print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        if(this.names().loadVariable(variable, node))
            return true
        if(this.second().loadVariable(variable, node))
            return true
        return this.body().loadVariable(variable, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLetNode(this);
    }

    public clone(): LetNode{
        return new LetNode(this.names(), this.second(), this.body())
    }

    public isLeaf(): boolean {
        return false
    }

    deapCopy(): InnerNode {
        return new LetNode(this.names().deapCopy(), this.second().deapCopy(), this.body().deapCopy())
    }
}


export class CallNode extends InnerNode{
    body(): InnerNode{
        return this._nodes[0]
    }

    constructor(body: InnerNode) {
        super();
        this.assignNode(body, this, 0)
    }

    public print(): string {
        return this.body().print()
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.body().loadVariable(variable, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onCallNode(this);
    }

    public clone(): CallNode{
        return new CallNode(this.body())
    }

    public isLeaf(): boolean {
        return false
    }

    deapCopy(): InnerNode {
        return new CallNode(this.body().deapCopy())
    }
}


export class BeginNode extends InnerNode{
    items(): CompositeNode{
        return this._nodes[0] as CompositeNode
    }
    
    constructor(items: CompositeNode) {
        super();
        this.assignNode(items, this, 0)
    }
    
    accept(visitor: LispASTVisitor): void {
        visitor.onBeginNode(this)
    }

    deapCopy(): InnerNode {
        return new BeginNode(this.items());
    }

    isLeaf(): boolean {
        return false;
    }
}

export class QuoteNode extends InnerNode{
    node(): InnerNode{
        return this._nodes[0]
    }

    constructor(node: InnerNode) {
        super();
        this.assignNode(node, this, 0)
    }

    accept(visitor: LispASTVisitor): void {
        visitor.onQuoteNode(this)
    }

    deapCopy(): InnerNode {
        return new QuoteNode(this.node())
    }

    isLeaf(): boolean {
        return false
    }
    
    print(): string {
        return '`' + this.node().print()
    }
}


export class CommaNode extends InnerNode{
    node(): InnerNode{
        return this._nodes[0]
    }

    constructor(node: InnerNode) {
        super();
        this.assignNode(node, this, 0)
    }

    accept(visitor: LispASTVisitor): void {
        visitor.onCommaNode(this)
    }

    deapCopy(): InnerNode {
        return new CommaNode(this.node());
    }

    isLeaf(): boolean {
        return false;
    }

    print(): string {
        return ',' + this.node().print()
    }
}

export class ReduceNode extends InnerNode{
    next(): InnerNode{
        return this._nodes[0]
    }
    
    reduced(): InnerNode{
        return this._nodes[1]
    }

    constructor(next: InnerNode, reduced: InnerNode) {
        super();
        this.assignNode(next, this, 0)
        this.assignNode(reduced, this, 1)
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.reduced().loadVariable(variable, node)
    }

    notifyUpdate(pos: number, node: InnerNode, returning: boolean) {
        if(!(this.parent instanceof NullNode))
            this.parent.notifyUpdate(this._position, node, returning)
    }

    public print(): string {
        return this.reduced().print()
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onReduceNode(this);
    }

    public isLeaf(): boolean {
        return false
    }

    public setColour(colour: ColourType) {
        this._colour = colour
        this.next().setColour(colour)
    }

    deapCopy(): InnerNode {
        return new ReduceNode(this.next().deapCopy(), this.reduced().deapCopy())
    }
}

export class NullNode extends InnerNode{
    constructor() {
        super();
    }

    public isLeaf(): boolean {
        throw new Error("Method not implemented.");
    }
    accept(visitor: LispASTVisitor): void {
        visitor.onNullNode(this)
    }

    print(): string {
        return "";
    }

    setColour(colour: ColourType): void {
        
    }

    update(node: InnerNode, returning: boolean): void {
    
    }

    deapCopy(): InnerNode {
        return new NullNode()
    }
}