"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NullNode = exports.ReduceNode = exports.BindNode = exports.CommaNode = exports.QuoteNode = exports.BeginNode = exports.CallNode = exports.LetNode = exports.OperatorNode = exports.StringNode = exports.ValueNode = exports.VarNode = exports.CompositeNode = exports.LambdaNode = exports.ApplicationNode = exports.BinaryExprNode = exports.UnaryExprNode = exports.IfNode = exports.MacroNode = exports.DefineNode = exports.MainNode = exports.LeafNode = exports.InnerNode = exports.TopNode = exports.Node = void 0;
const InstructionShortcut_1 = require("../SECD/instructions/InstructionShortcut");
const ColourType_1 = require("../SECD/ColourType");
class Node {
    constructor() {
        this._colour = ColourType_1.ColourType.None;
        this._nodes = Array();
    }
    get colour() {
        throw new Error("Method not implemented.");
    }
    set colour(value) {
        throw new Error("Method not implemented.");
    }
    /**
     * Creates ReduceNode from its subtree and its updated node
     * @param pos - position of the node being updated
     * @param node - updated node
     * @param returning - the update is triggered by returning from the function
     */
    notifyUpdate(pos, node, returning) {
        this.createReduceNode(this._nodes[pos], node, this, pos);
    }
    /**
     * Set all colours in tree to None
     */
    clean() {
        this._colour = ColourType_1.ColourType.None;
        this._nodes.forEach(node => node.clean());
    }
    /**
     * Create ReduceNode from a subtree and updated value
     * @param original - original subtree
     * @param reduced - reduced subtree
     * @param parent - parent of the new ReduceNode
     * @param pos - position of the original node in the parent node
     * @protected
     */
    createReduceNode(original, reduced, parent, pos) {
        let res = (original instanceof ReduceNode) ? new ReduceNode(original.original(), reduced) : new ReduceNode(original, reduced);
        res.parent = parent;
        res.position = pos;
        parent._nodes[pos] = res;
        return res;
    }
    /**
     * Assign a node as a subtree of a parent node
     * @param node - node to assign
     * @param parent - assign to this node
     * @param pos - position of the assigned node
     * @protected
     */
    assignNode(node, parent, pos) {
        node.parent = parent;
        node.position = pos;
        parent._nodes.push(node);
        return node;
    }
    /**
     * Change subnode of this node
     * @param node - new node
     * @param pos - pos of the node to be changed
     */
    setNode(node, pos) {
        this._nodes[pos] = node;
        this._nodes[pos].parent = this;
        this._nodes[pos].position = pos;
    }
}
exports.Node = Node;
/**
 * Top node of the AST
 */
class TopNode extends Node {
    constructor(functions) {
        super();
        let i = 0;
        this.topLevelExprs = functions.map(func => this.assignNode(func, this, i++));
    }
    notifyUpdate(pos, node, returning) {
    }
    print() {
        return this.topLevelExprs.map(func => func.print() + '\n').join("");
    }
    accept(visitor) {
        visitor.onTopNode(this);
    }
    update(node, returning) {
        throw new Error("Method not implemented.");
    }
    setColour(colour) {
    }
}
exports.TopNode = TopNode;
/**
 * Non top node of the AST
 */
class InnerNode extends Node {
    constructor() {
        super();
        this._position = 0;
    }
    get colour() {
        return this._colour;
    }
    set colour(value) {
        this._colour = value;
    }
    set position(value) {
        this._position = value;
    }
    get position() {
        return this._position;
    }
    set parent(value) {
        this._parent = value;
    }
    get parent() {
        return typeof (this._parent) != "undefined" ? this._parent : new NullNode();
    }
    print() {
        throw new Error("Method not implemented.");
    }
    hasParent() {
        if (this._parent)
            return true;
        return false;
    }
    update(node, returning) {
        if (!(this.parent instanceof NullNode))
            this.parent.notifyUpdate(this._position, node, returning); //Update pointer to a subtree of the parent
    }
    loadVariable(variable, node) {
        return false;
    }
    setColour(colour) {
        this._colour = colour;
    }
    clone() {
        return this;
    }
    removeReduction() {
        this._nodes.forEach(node => {
            if (node instanceof ReduceNode) {
                //If reduce node, remove the reduce node for its original subtree
                this._nodes[node.position] = node.original();
                node.original().position = node.position;
                node.original().parent = this;
            }
        });
        this._nodes.forEach(node => {
            node.removeReduction();
        });
    }
}
exports.InnerNode = InnerNode;
class LeafNode extends InnerNode {
    isValue() {
        return true;
    }
}
exports.LeafNode = LeafNode;
class MainNode extends InnerNode {
    constructor(node) {
        super();
        this.node = this.assignNode(node, this, 0);
    }
    print() {
        return this.node.print();
    }
    accept(visitor) {
        return visitor.onMainNode(this);
    }
    loadVariable(variable, node) {
        return this.node.loadVariable(variable, node);
    }
    setColour(colour) {
        this.node.setColour(colour);
    }
    isValue() {
        return false;
    }
}
exports.MainNode = MainNode;
class DefineNode extends InnerNode {
    constructor(name, vars, body, isMarco = false) {
        super();
        this.name = name;
        this.isMacro = isMarco;
        this.assignNode(vars, this, 0);
        this.assignNode(body, this, 1);
    }
    vars() {
        return this._nodes[0];
    }
    body() {
        return this._nodes[1];
    }
    print() {
        return '(define' + (this.isMacro ? '-macro' : '') + ' ' + this.name + this.vars().print() + '\t' + this.body().print() + ')\n';
    }
    accept(visitor) {
        return visitor.onDefineNode(this);
    }
    loadVariable(variable, node) {
        return this.body().loadVariable(variable, node);
    }
    isValue() {
        return false;
    }
}
exports.DefineNode = DefineNode;
class MacroNode extends InnerNode {
    constructor(code) {
        super();
        this.code = Array(code);
    }
    accept(visitor) {
        visitor.onMacroNode(this);
    }
    isValue() {
        return false;
    }
    push(code) {
        this.code.push(code);
    }
    toString() {
        let res = "";
        this.code.forEach(item => res += item.toString());
        return res;
    }
}
exports.MacroNode = MacroNode;
class IfNode extends InnerNode {
    condition() {
        return this._nodes[0];
    }
    left() {
        return this._nodes[1];
    }
    right() {
        return this._nodes[2];
    }
    constructor(condition, node1, node2) {
        super();
        this.assignNode(condition, this, 0);
        this.assignNode(node1, this, 1);
        this.assignNode(node2, this, 2);
    }
    print() {
        return "(if " + this.condition().print() + " " + this.left().print() + " " + this.right().print() + " ";
    }
    loadVariable(variable, node) {
        if (this.condition().loadVariable(variable, node))
            return true;
        else if (this.right().loadVariable(variable, node))
            return true;
        return this.left().loadVariable(variable, node);
    }
    removeReduction() {
        super.removeReduction();
    }
    accept(visitor) {
        visitor.onIfNode(this);
    }
    clone() {
        return new IfNode(this.condition(), this.left(), this.right());
    }
    isValue() {
        return false;
    }
}
exports.IfNode = IfNode;
class UnaryExprNode extends InnerNode {
    operator() {
        return this._nodes[0];
    }
    expr() {
        return this._nodes[1];
    }
    constructor(operator, node) {
        super();
        this.assignNode(operator, this, 0);
        this.assignNode(node, this, 1);
    }
    print() {
        return "(" + this.operator().print() + " " + this.expr().print() + ")";
    }
    loadVariable(variable, node) {
        return this.expr().loadVariable(variable, node);
    }
    accept(visitor) {
        visitor.onUnaryExprNode(this);
    }
    clone() {
        return new UnaryExprNode(this.operator(), this.expr());
    }
    isValue() {
        return false;
    }
}
exports.UnaryExprNode = UnaryExprNode;
class BinaryExprNode extends InnerNode {
    operator() {
        return this._nodes[0];
    }
    left() {
        return this._nodes[1];
    }
    right() {
        return this._nodes[2];
    }
    constructor(node1, node2, operator) {
        super();
        this.assignNode(operator, this, 0);
        this.assignNode(node1, this, 1);
        this.assignNode(node2, this, 2);
    }
    print() {
        return '(' + this.operator().print() + ' ' + this.left().print() + ' ' + this.right().print() + ')';
    }
    loadVariable(variable, node) {
        if (this.operator().loadVariable(variable, node))
            return true;
        if (this.right().loadVariable(variable, node))
            return true;
        return this.left().loadVariable(variable, node);
    }
    accept(visitor) {
        visitor.onBinaryExprNode(this);
    }
    clone() {
        return new BinaryExprNode(this.left(), this.right(), this.operator());
    }
    isValue() {
        return false;
    }
}
exports.BinaryExprNode = BinaryExprNode;
class ApplicationNode extends InnerNode {
    func() {
        return this._nodes[0];
    }
    args() {
        return this._nodes[1];
    }
    constructor(func, args) {
        super();
        this.assignNode(func, this, 0);
        this.assignNode(args, this, 1);
    }
    print() {
        return "(" + this.func().print() + " " + this.args().print() + ")";
    }
    loadVariable(variable, node) {
        if (this.func().loadVariable(variable, node))
            return true;
        return this.args().loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        if (returning) { //If creating reduce node of a function returned value, move ir even one level up
            if (!(this.parent instanceof NullNode))
                this.parent.notifyUpdate(this._position, node, true);
        }
        else {
            this.createReduceNode(this._nodes[pos], node, this, pos);
        }
    }
    accept(visitor) {
        visitor.onApplicationNode(this);
    }
    clone() {
        return new ApplicationNode(this.func(), this.args());
    }
    isValue() {
        return false;
    }
}
exports.ApplicationNode = ApplicationNode;
class LambdaNode extends InnerNode {
    vars() {
        return this._nodes[0];
    }
    body() {
        return this._nodes[1];
    }
    constructor(vars, body) {
        super();
        this.assignNode(vars, this, 0);
        this.assignNode(body, this, 1);
    }
    print() {
        return "(lambda (" + this.vars().print() + ")" + this.body().print() + ")";
    }
    loadVariable(variable, node) {
        return this.body().loadVariable(variable, node);
    }
    accept(visitor) {
        visitor.onLambdaNode(this);
    }
    clone() {
        return new LambdaNode(this.vars(), this.body());
    }
    isValue() {
        return false;
    }
}
exports.LambdaNode = LambdaNode;
class CompositeNode extends InnerNode {
    items() {
        return this._nodes;
    }
    constructor(items) {
        super();
        let pos = 0;
        items.map(item => this.assignNode(item, this, pos++));
    }
    addItemBack(item) {
        item.position = this.items().length;
        item.parent = this;
        this._nodes.push(item);
    }
    addItemFront(item) {
        item.position = 0;
        item.parent = this;
        this._nodes.forEach(node => node.position++);
        this._nodes.unshift(item);
    }
    popFront() {
        this._nodes.shift();
        this._nodes.forEach(item => item.position--);
    }
    print() {
        if (this.items().length == 0)
            return "";
        return (this.items().map(item => item.print() + " ").reduce((acc, str) => { return acc += str; })).slice(0, -1);
    }
    loadVariable(variable, node) {
        let acc = new CompositeNode(Array());
        let changed = false;
        this.items().forEach(item => {
            changed = item.loadVariable(variable, node);
            if (item instanceof VarNode) {
                if (item.variable == variable) {
                    changed = true;
                    item = item.parent;
                }
            }
            else if (item instanceof ValueNode && node instanceof ValueNode) {
                if (item.value == node.value) {
                    changed = true;
                    item = item.parent;
                }
            }
            acc.addItemBack(item);
            return acc;
        });
        if (changed)
            if (!(this.parent instanceof NullNode))
                this.parent.notifyUpdate(this.position, acc, false);
        return changed;
    }
    accept(visitor) {
        visitor.onCompositeNode(this);
    }
    clone() {
        return new CompositeNode(this.items().map(item => item));
    }
    isValue() {
        return false;
    }
}
exports.CompositeNode = CompositeNode;
class VarNode extends LeafNode {
    constructor(variable) {
        super();
        this.variable = variable;
    }
    print() {
        return this.variable;
    }
    loadVariable(variable, node) {
        if (this.variable == variable) {
            this.update(node, false);
            return true;
        }
        return false;
    }
    accept(visitor) {
        visitor.onVarNode(this);
    }
}
exports.VarNode = VarNode;
class ValueNode extends LeafNode {
    constructor(value) {
        super();
        if (typeof (value) == "boolean") {
            if (value)
                this.value = 1;
            else
                this.value = 0;
        }
        else
            this.value = value;
    }
    print() {
        return this.value.toString();
    }
    accept(visitor) {
        visitor.onValueNode(this);
    }
    isValue() {
        return true;
    }
    clone() {
        return new ValueNode(this.value);
    }
}
exports.ValueNode = ValueNode;
class StringNode extends LeafNode {
    constructor(str) {
        super();
        this.str = str;
    }
    print() {
        return "\"" + this.str + "\"";
    }
    accept(visitor) {
        visitor.onStringNode(this);
    }
    add(str) {
        this.str += str;
    }
}
exports.StringNode = StringNode;
class OperatorNode extends LeafNode {
    constructor(operator) {
        super();
        this.operator = operator;
    }
    print() {
        return InstructionShortcut_1.InstructionShortcut[this.operator];
    }
    accept(visitor) {
        visitor.onOperatorNode(this);
    }
    clone() {
        return new OperatorNode(this.operator);
    }
    setColour(colour) {
        this.parent.setColour(colour);
    }
}
exports.OperatorNode = OperatorNode;
class LetNode extends InnerNode {
    constructor(bindings, body, recursive = false) {
        super();
        this.assignNode(bindings, this, 0);
        this.assignNode(body, this, 1);
        this.recursive = recursive;
    }
    bindings() {
        return this._nodes[0];
    }
    body() {
        return this._nodes[1];
    }
    print() {
        return "(let" + (this.recursive ? "rec" : "") + this.bindings().print() + this.body().print() + ")";
    }
    loadVariable(variable, node) {
        if (this.bindings().loadVariable(variable, node))
            return true;
        return this.body().loadVariable(variable, node);
    }
    accept(visitor) {
        visitor.onLetNode(this);
    }
    clone() {
        return new LetNode(this.bindings(), this.body());
    }
    isValue() {
        return false;
    }
}
exports.LetNode = LetNode;
class CallNode extends InnerNode {
    body() {
        return this._nodes[0];
    }
    constructor(body) {
        super();
        this.assignNode(body, this, 0);
    }
    print() {
        return '(' + this.body().print() + ')';
    }
    loadVariable(variable, node) {
        return this.body().loadVariable(variable, node);
    }
    accept(visitor) {
        visitor.onCallNode(this);
    }
    clone() {
        return new CallNode(this.body());
    }
    isValue() {
        return false;
    }
}
exports.CallNode = CallNode;
class BeginNode extends InnerNode {
    items() {
        return this._nodes[0];
    }
    constructor(items) {
        super();
        this.assignNode(items, this, 0);
    }
    accept(visitor) {
        visitor.onBeginNode(this);
    }
    isValue() {
        return false;
    }
}
exports.BeginNode = BeginNode;
class QuoteNode extends InnerNode {
    constructor(node, isBack = false) {
        super();
        this.assignNode(node, this, 0);
        this.isBack = isBack;
    }
    node() {
        return this._nodes[0];
    }
    accept(visitor) {
        visitor.onQuoteNode(this);
    }
    isValue() {
        return true;
    }
    print() {
        return this.isBack ? '`' : '\'' + this.node().print();
    }
}
exports.QuoteNode = QuoteNode;
class CommaNode extends InnerNode {
    node() {
        return this._nodes[0];
    }
    constructor(node) {
        super();
        this.assignNode(node, this, 0);
    }
    accept(visitor) {
        visitor.onCommaNode(this);
    }
    isValue() {
        return false;
    }
    print() {
        return ',' + this.node().print();
    }
}
exports.CommaNode = CommaNode;
class BindNode extends InnerNode {
    variable() {
        return this._nodes[0];
    }
    binded() {
        return this._nodes[1];
    }
    constructor(variable, binded) {
        super();
        this.assignNode(variable, this, 0);
        this.assignNode(binded, this, 1);
    }
    loadVariable(variable, node) {
        return this.binded().loadVariable(variable, node);
    }
    print() {
        return '(' + this.variable().print() + ' ' + this.binded().print() + ')';
    }
    accept(visitor) {
        visitor.onBindNode(this);
    }
    isValue() {
        return false;
    }
}
exports.BindNode = BindNode;
class ReduceNode extends InnerNode {
    original() {
        return this._nodes[0];
    }
    reduced() {
        return this._nodes[1];
    }
    constructor(next, reduced) {
        super();
        this.assignNode(next, this, 0);
        this.assignNode(reduced, this, 1);
    }
    loadVariable(variable, node) {
        return this.reduced().loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        if (!(this.parent instanceof NullNode))
            this.parent.notifyUpdate(this._position, node, returning); //This prevents creating several ReduceNodes inside each other
    }
    print() {
        return this.reduced().print();
    }
    accept(visitor) {
        visitor.onReduceNode(this);
    }
    isValue() {
        return false;
    }
    setColour(colour) {
        this._colour = colour;
        this.original().setColour(colour); //Set also original subtree to highlight the source code
    }
}
exports.ReduceNode = ReduceNode;
class NullNode extends InnerNode {
    constructor() {
        super();
    }
    isValue() {
        throw new Error("Method not implemented.");
    }
    accept(visitor) {
        visitor.onNullNode(this);
    }
    print() {
        return "";
    }
    setColour(colour) {
    }
    update(node, returning) {
    }
}
exports.NullNode = NullNode;
//# sourceMappingURL=AST.js.map