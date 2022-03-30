"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InstructionShortcut_1 = require("../utility/instructions/InstructionShortcut");
const ColourType_1 = require("../utility/SECD/ColourType");
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
    notifyUpdate(pos, node, returning) {
        this.createReduceNode(this._nodes[pos], node, this, pos);
    }
    clean() {
        this._colour = ColourType_1.ColourType.None;
        this._nodes.forEach(node => node.clean());
    }
    createReduceNode(next, reduced, parent, pos) {
        let res = (next instanceof ReduceNode) ? new ReduceNode(next.next(), reduced) : new ReduceNode(next, reduced);
        res.parent = parent;
        res.position = pos;
        parent._nodes[pos] = res;
        return res;
    }
    assignNode(node, parent, pos) {
        node.parent = parent;
        node.position = pos;
        parent._nodes.push(node);
        return node;
    }
    setNode(node, pos) {
        this._nodes[pos] = node;
        this._nodes[pos].parent = this;
        this._nodes[pos].position = pos;
    }
}
exports.Node = Node;
class TopNode extends Node {
    constructor(node, functions) {
        super();
        this.node = this.assignNode(node, this, 0);
        let i = 0;
        this.functions = functions.map(func => this.assignNode(func, this, ++i));
    }
    notifyUpdate(pos, node, returning) {
        this.node = this.createReduceNode(this.node, node, this, 0);
    }
    print() {
        return this.functions.map(func => func.print() + '\n').join("") + this.node.print();
    }
    accept(visitor) {
        visitor.onTopNode(this);
    }
    update(node, returning) {
        throw new Error("Method not implemented.");
    }
    setColour(colour) {
        this.node.setColour(colour);
    }
}
exports.TopNode = TopNode;
class InnerNode extends Node {
    constructor() {
        super();
        this._position = 0;
        this._returned = false;
    }
    get returned() {
        return this._returned;
    }
    set returned(value) {
        this._returned = value;
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
            this.parent.notifyUpdate(this._position, node, returning);
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
            if (node instanceof ReduceNode && !node.returned) {
                this._nodes[node.position] = node.next();
                node.next().position = node.position;
                node.next().parent = this;
            }
        });
        this._nodes.forEach(node => {
            if (!node.returned)
                node.removeReduction();
        });
    }
}
exports.InnerNode = InnerNode;
class LeafNode extends InnerNode {
    isLeaf() {
        return true;
    }
    deapCopy() {
        return this.clone();
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
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new MainNode(this.node.deapCopy());
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
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new DefineNode(this.name, this.vars().deapCopy(), this.body().deapCopy());
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
    deapCopy() {
        return new NullNode(); //TODO
    }
    isLeaf() {
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
        if (this.left().loadVariable(variable, node))
            return true;
        return this.right().loadVariable(variable, node);
    }
    accept(visitor) {
        visitor.onIfNode(this);
    }
    clone() {
        return new IfNode(this.condition(), this.left(), this.right());
    }
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new IfNode(this.condition().deapCopy(), this.left().deapCopy(), this.right().deapCopy());
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
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new UnaryExprNode(this.operator().deapCopy(), this.expr().deapCopy());
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
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new BinaryExprNode(this.left().deapCopy(), this.right().deapCopy(), this.operator().deapCopy());
    }
}
exports.BinaryExprNode = BinaryExprNode;
class FuncNode extends InnerNode {
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
        if (returning) {
            if (!(this.parent instanceof NullNode))
                this.parent.notifyUpdate(this._position, node, true);
        }
        else {
            this.createReduceNode(this._nodes[pos], node, this, pos);
        }
    }
    accept(visitor) {
        visitor.onFuncNode(this);
    }
    clone() {
        return new FuncNode(this.func(), this.args());
    }
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new FuncNode(this.func().deapCopy(), this.args().deapCopy());
    }
}
exports.FuncNode = FuncNode;
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
    /*public clone(): LambdaNode{
        return new LambdaNode(this.vars, this.body)
    }*/
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new LambdaNode(this.vars().deapCopy(), this.body().deapCopy());
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
            else
                changed = true;
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
    isLeaf() {
        return false;
    }
    setColour(colour) {
        this.items().forEach(item => item.setColour(colour));
    }
    removeReduction() {
        super.removeReduction();
        let i = 0;
        this.items().forEach(item => this.items()[i] = this._nodes[i++]);
    }
    deapCopy() {
        return new CompositeNode(this.items().map(item => item.deapCopy()));
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
    /*
        public clone(): VarNode{
            return new VarNode(this.variable)
        }*/
    deapCopy() {
        return new VarNode(this.variable);
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
    isLeaf() {
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
}
exports.OperatorNode = OperatorNode;
class ListNode extends LeafNode {
    items() {
        return this._nodes[0];
    }
    constructor(arr) {
        super();
        this.assignNode(new CompositeNode(arr), this, 0);
    }
    print() {
        return "(" + this.items().print() + ")";
    }
    accept(visitor) {
        visitor.onListNode(this);
    }
    isLeaf() {
        return true;
    }
}
exports.ListNode = ListNode;
class LetNode extends InnerNode {
    constructor(names, second, body, recursive = false) {
        super();
        this.assignNode(names, this, 0);
        this.assignNode(second, this, 1);
        this.assignNode(body, this, 2);
        this.recursive = recursive;
    }
    names() {
        return this._nodes[0];
    }
    second() {
        return this._nodes[1];
    }
    body() {
        return this._nodes[2];
    }
    print() {
        return "(let" + (this.recursive ? "rec" : "") + "(" + this.names().print() + ")\n(" + this.second().print() + ")\n" + this.body().print() + ")";
    }
    loadVariable(variable, node) {
        if (this.names().loadVariable(variable, node))
            return true;
        if (this.second().loadVariable(variable, node))
            return true;
        return this.body().loadVariable(variable, node);
    }
    accept(visitor) {
        visitor.onLetNode(this);
    }
    clone() {
        return new LetNode(this.names(), this.second(), this.body());
    }
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new LetNode(this.names().deapCopy(), this.second().deapCopy(), this.body().deapCopy());
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
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new CallNode(this.body().deapCopy());
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
    deapCopy() {
        return new BeginNode(this.items());
    }
    isLeaf() {
        return false;
    }
}
exports.BeginNode = BeginNode;
class QuoteNode extends InnerNode {
    node() {
        return this._nodes[0];
    }
    constructor(node) {
        super();
        this.assignNode(node, this, 0);
    }
    accept(visitor) {
        visitor.onQuoteNode(this);
    }
    deapCopy() {
        return new QuoteNode(this.node());
    }
    isLeaf() {
        return false;
    }
    print() {
        return '`' + this.node().print();
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
    deapCopy() {
        return new CommaNode(this.node());
    }
    isLeaf() {
        return false;
    }
    print() {
        return ',' + this.node().print();
    }
}
exports.CommaNode = CommaNode;
class ReduceNode extends InnerNode {
    next() {
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
            this.parent.notifyUpdate(this._position, node, returning);
    }
    print() {
        return this.reduced().print();
    }
    accept(visitor) {
        visitor.onReduceNode(this);
    }
    isLeaf() {
        return false;
    }
    setColour(colour) {
        this._colour = colour;
        this.next().setColour(colour);
    }
    deapCopy() {
        return new ReduceNode(this.next().deapCopy(), this.reduced().deapCopy());
    }
}
exports.ReduceNode = ReduceNode;
class NullNode extends InnerNode {
    constructor() {
        super();
    }
    isLeaf() {
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
    deapCopy() {
        return new NullNode();
    }
}
exports.NullNode = NullNode;
//# sourceMappingURL=AST.js.map