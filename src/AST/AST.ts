import {InstructionShortcut} from "../SECD/instructions/InstructionShortcut";
import {ColourType} from "../SECD/ColourType";
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

    /**
     * Pretty prints the node for debugging purposes
     */

    public abstract print(): string;

    /**
     * Creates ReduceNode from its subtree and its updated node
     * @param pos - position of the node being updated
     * @param node - updated node
     * @param returning - the update is triggered by returning from the function
     */

    public notifyUpdate(pos: number, node: InnerNode, returning: boolean): void {
        this.createReduceNode(this._nodes[pos], node, this, pos)
    }

    /**
     * Implements visitor pattern
     * @param visitor
     */

    public abstract accept(visitor: LispASTVisitor): void

    /**
     * Update this node by a node
     * @param node - updated node
     * @param returning  - the update is triggered by returning from the function
     */

    public abstract update(node: InnerNode, returning: boolean): void

    /**
     * Set the colour of the node
     * @param colour - new colour
     */

    public abstract setColour(colour: ColourType): void

    /**
     * Set all colours in tree to None
     */

    public clean(){
        this._colour = ColourType.None
        this._nodes.forEach(node => node.clean())
    }

    /**
     * Create ReduceNode from a subtree and updated value
     * @param original - original subtree
     * @param reduced - reduced subtree
     * @param parent - parent of the new ReduceNode
     * @param pos - position of the original node in the parent node
     * @protected
     */

    protected createReduceNode(original: InnerNode, reduced: InnerNode, parent: Node, pos: number): ReduceNode{//Maybe use pos instead of index
        let res = (original instanceof ReduceNode) ? new ReduceNode(original.original(), reduced) : new ReduceNode(original, reduced)
        res.parent = parent
        res.position = pos
        parent._nodes[pos] = res
        return res
    }

    /**
     * Assign a node as a subtree of a parent node
     * @param node - node to assign
     * @param parent - assign to this node
     * @param pos - position of the assigned node
     * @protected
     */
    
    protected assignNode(node: InnerNode, parent: Node, pos: number): InnerNode{
        node.parent = parent
        node.position = pos
        parent._nodes.push(node)
        return node
    }

    /**
     * Change subnode of this node
     * @param node - new node
     * @param pos - pos of the node to be changed
     */
    
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
    get returned(): boolean {
        return this._returned;
    }

    set returned(value: boolean) {
        this._returned = value;//Mozna smazat???
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

    get parent(): Node {
        return typeof(this._parent) != "undefined" ? this._parent : new NullNode();
    }

    public _parent?: Node
    public _returned: boolean

    public print(): string {
        throw new Error("Method not implemented.");
    }

    protected constructor() {
        super()
        this._position = 0
        this._returned = false
    }

    public hasParent(): boolean{
        if(this._parent)
            return true
        return false
    }
    
    public abstract isValue(): boolean
    
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

    public removeReduction(){
        this._nodes.forEach(node => {
            if(node instanceof ReduceNode && !node.returned) {
                this._nodes[node.position] = node.original()
                node.original().position = node.position
                node.original().parent = this
            }
        })
        this._nodes.forEach(node => {
            if(!node.returned)
                node.removeReduction()
        })
    }
}

export abstract class LeafNode extends InnerNode{
    
    
    isValue(): boolean {
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

    isValue(): boolean {
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
        return '(define' + (this.isMacro ? '-macro' : '') + ' ' + this.name + this.vars().print() + '\t' + this.body().print() + ')\n'
    }

    accept(visitor: LispASTVisitor): void {
        return visitor.onDefineNode(this)
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.body().loadVariable(variable, node)
    }

    isValue(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new DefineNode(this.name, this.vars().deapCopy(), this.body().deapCopy())
    }
}


export class MacroNode extends InnerNode{

    code: Array<InnerNode>

    constructor(code: InnerNode) {
        super();
        this.code = Array(code)
    }

    accept(visitor: LispASTVisitor): void {
        visitor.onMacroNode(this)
    }

    deapCopy(): InnerNode {
        return new NullNode()//TODO
    }

    isValue(): boolean {
        return false;
    }

    push(code: InnerNode){
        this.code.push(code)
    }

    public toString(): string{
        let res = ""
        this.code.forEach(item => res += item.toString())
        return res
    }
}


export class IfNode extends InnerNode{
    get chosenBranch(): number {
        return this._chosenBranch;
    }

    set chosenBranch(value: number) {
        this._chosenBranch = value;
    }
    condition(): InnerNode{
        return this._nodes[0]
    }
    
    left(): InnerNode{
        return this._nodes[1]
    }
    
    right(): InnerNode{
        return this._nodes[2]
    }
    
    private _chosenBranch: number

    constructor(condition: InnerNode, node1: InnerNode, node2: InnerNode) {
        super();
        this.assignNode(condition, this, 0)
        this.assignNode(node1, this, 1)
        this.assignNode(node2, this, 2)
        this._chosenBranch = 0
    }

    public print(): string {
        return "(if " + this.condition().print() + " " + this.left().print() + " " + this.right().print() + " "
    }

    loadVariable(variable: string, node: InnerNode): boolean {
        if(this.condition().loadVariable(variable, node))
            return true
        else if(this.left().loadVariable(variable, node))
            return true
        return this.right().loadVariable(variable, node)
    }

    public removeReduction(){
        super.removeReduction()
        this.chosenBranch = 0//The if expression must be evaluated once more
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onIfNode(this);
    }

    public clone(): IfNode{
        return new IfNode(this.condition(), this.left(), this.right())
    }

    isValue(): boolean {
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

    isValue(): boolean {
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

    isValue(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new BinaryExprNode(this.left().deapCopy(), this.right().deapCopy(), this.operator().deapCopy())
    }
}


export class ApplicationNode extends InnerNode{
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
        visitor.onApplicationNode(this);
    }

    public clone(): ApplicationNode{
        return new ApplicationNode(this.func(), this.args())
    }

    isValue(): boolean {
        return false;
    }

    deapCopy(): InnerNode {
        return new ApplicationNode(this.func().deapCopy(), this.args().deapCopy())
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

    isValue(): boolean {
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
        this._nodes.forEach(node => node.position ++)
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
            }/*
            else 
                changed = true*/
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

    isValue(): boolean {
        return false;
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

    public isValue(): boolean {
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
    
    public add(str: string): void {
        this.str += str
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

    public setColour(colour: ColourType) {//If operator is Coloured, colour whole expression including arguments
        this.parent.setColour(colour)
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

    public isValue(): boolean {
        return true
    }

    /*public clone(): ListNode{

    }*///TODO
}


export class LetNode extends InnerNode {
    bindings(): InnerNode{
        return this._nodes[0]
    }
    
    body(): InnerNode{
        return this._nodes[1]
    }
    
    recursive: boolean

    constructor(bindings: InnerNode, body: InnerNode, recursive: boolean = false) {
        super();
        this.assignNode(bindings, this, 0)
        this.assignNode(body, this, 1)
        this.recursive = recursive
    }

    public print(): string {
        return "(let" + (this.recursive ? "rec" : "") + this.bindings().print() + this.body().print() + ")"
    }

    loadVariable(variable: string, node: InnerNode) {
        if(this.bindings().loadVariable(variable, node))
            return true
        return this.body().loadVariable(variable, node)
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onLetNode(this);
    }

    public clone(): LetNode{
        return new LetNode(this.bindings(), this.body())
    }

    public isValue(): boolean {
        return false
    }

    deapCopy(): InnerNode {
        return new LetNode(this.bindings().deapCopy(), this.body().deapCopy())
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
        return '(' + this.body().print() + ')'
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

    public isValue(): boolean {
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

    isValue(): boolean {
        return false;
    }
}

export class QuoteNode extends InnerNode{
    isBack: boolean
    
    node(): InnerNode{
        return this._nodes[0]
    }

    constructor(node: InnerNode, isBack: boolean = false) {
        super();
        this.assignNode(node, this, 0)
        this.isBack = isBack
    }

    accept(visitor: LispASTVisitor): void {
        visitor.onQuoteNode(this)
    }

    deapCopy(): InnerNode {
        return new QuoteNode(this.node())
    }

    isValue(): boolean {
        return true
    }
    
    print(): string {
        return this.isBack ? '`' : '\'' + this.node().print()
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

    isValue(): boolean {
        return false;
    }

    print(): string {
        return ',' + this.node().print()
    }
}


export class BindNode extends InnerNode{
    variable(): VarNode{
        return this._nodes[0] as VarNode
    }

    binded(): InnerNode{
        return this._nodes[1]
    }

    constructor(variable: InnerNode, binded: InnerNode) {
        super();
        this.assignNode(variable, this, 0)
        this.assignNode(binded, this, 1)
    }

    loadVariable(variable: string, node: InnerNode) {
        return this.binded().loadVariable(variable, node)
    }

    public print(): string {
        return '(' + this.variable().print() + ' ' + this.binded().print() + ')'
    }

    public accept(visitor: LispASTVisitor): void {
        visitor.onBindNode(this);
    }

    public isValue(): boolean {
        return false
    }

    deapCopy(): InnerNode {
        return new BindNode(this.variable().deapCopy(), this.binded().deapCopy())
    }
}   

export class ReduceNode extends InnerNode{
    original(): InnerNode{
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

    public isValue(): boolean {
        return false
    }

    public setColour(colour: ColourType) {
        this._colour = colour
        this.original().setColour(colour)
    }

    deapCopy(): InnerNode {
        return new ReduceNode(this.original().deapCopy(), this.reduced().deapCopy())
    }
}

export class NullNode extends InnerNode{
    constructor() {
        super();
    }

    public isValue(): boolean {
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