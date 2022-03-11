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
    clean() {
        this._colour = ColourType_1.ColourType.None;
        this._nodes.forEach(node => node.clean());
    }
    removeReduction() {
        this._nodes.forEach(node => {
            if (node instanceof EndNode) {
                this._nodes[node.position] = node.next;
                node.next.position = node.position;
                node.next.parent = this;
            }
        });
        this._nodes.forEach(node => node.removeReduction());
    }
    createEndNode(next, reduced, parent, pos) {
        let index = parent._nodes.indexOf(next);
        let res = (next instanceof EndNode) ? new EndNode(next.next, reduced) : new EndNode(next, reduced);
        res.parent = parent;
        res.position = pos;
        parent._nodes[index] = res;
        return res;
    }
    assignNode(node, parent, pos) {
        node.parent = parent;
        node.position = pos;
        parent._nodes.push(node);
        return node;
    }
}
exports.Node = Node;
class TopNode extends Node {
    constructor(node, functions) {
        super();
        this.node = this.assignNode(node, this, 0);
        let i = 0;
        this.functions = functions.map(func => this.assignNode(func, this, i++));
    }
    notifyUpdate(pos, node, returning) {
        this.node = this.createEndNode(this.node, node, this, 0);
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
    notifyUpdate(pos, node, returning) {
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
    constructor(name, vars, body) {
        super();
        this.name = name;
        this.vars = this.assignNode(vars, this, 0);
        this.body = this.assignNode(body, this, 1);
    }
    print() {
        return '(define ' + this.name + '(' + this.vars.print() + ')\n\t' + this.body.print() + ')\n';
    }
    accept(visitor) {
        return visitor.onDefineNode(this);
    }
    loadVariable(variable, node) {
        return this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
    }
    isLeaf() {
        return false;
    }
    deapCopy() {
        return new DefineNode(this.name, this.vars.deapCopy(), this.body.deapCopy());
    }
}
exports.DefineNode = DefineNode;
class IfNode extends InnerNode {
    constructor(condition, node1, node2) {
        super();
        this.condition = this.assignNode(condition, this, 0);
        this.left = this.assignNode(node1, this, 1);
        this.right = this.assignNode(node2, this, 2);
    }
    print() {
        return "(if " + this.condition.print() + " " + this.left.print() + " " + this.right.print() + " ";
    }
    loadVariable(variable, node) {
        if (this.condition.loadVariable(variable, node))
            return true;
        if (this.left.loadVariable(variable, node))
            return true;
        return this.right.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        switch (pos) {
            case 0:
                this.condition = this.createEndNode(this.condition, node, this, 0);
                break;
            case 1:
                this.left = this.createEndNode(this.left, node, this, 1);
                break;
            case 2:
                this.right = this.createEndNode(this.right, node, this, 2);
                break;
        }
    }
    accept(visitor) {
        visitor.onIfNode(this);
    }
    clone() {
        return new IfNode(this.condition, this.left, this.right);
    }
    isLeaf() {
        return false;
    }
    removeReduction() {
        super.removeReduction();
        this.condition = this._nodes[0];
        this.left = this._nodes[1];
        this.right = this._nodes[2];
    }
    deapCopy() {
        return new IfNode(this.condition.deapCopy(), this.left.deapCopy(), this.right.deapCopy());
    }
}
exports.IfNode = IfNode;
class UnaryExprNode extends InnerNode {
    constructor(operator, node) {
        super();
        this.operator = this.assignNode(operator, this, 0);
        this.expr = this.assignNode(node, this, 1);
    }
    print() {
        return "(" + this.operator.print() + " " + this.expr.print() + ")";
    }
    loadVariable(variable, node) {
        return this.expr.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        this.expr = this.createEndNode(this.expr, node, this, 0);
    }
    accept(visitor) {
        visitor.onUnaryExprNode(this);
    }
    clone() {
        return new UnaryExprNode(this.operator, this.expr);
    }
    isLeaf() {
        return false;
    }
    removeReduction() {
        super.removeReduction();
        this.operator = this._nodes[0];
        this.expr = this._nodes[1];
    }
    deapCopy() {
        return new UnaryExprNode(this.operator.deapCopy(), this.expr.deapCopy());
    }
}
exports.UnaryExprNode = UnaryExprNode;
class BinaryExprNode extends InnerNode {
    constructor(node1, node2, operator) {
        super();
        this.operator = this.assignNode(operator, this, 0);
        this.left = this.assignNode(node1, this, 1);
        this.right = this.assignNode(node2, this, 2);
    }
    print() {
        return '(' + this.operator.print() + ' ' + this.left.print() + ' ' + this.right.print() + ')';
    }
    loadVariable(variable, node) {
        if (this.operator.loadVariable(variable, node))
            return true;
        if (this.right.loadVariable(variable, node))
            return true;
        return this.left.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        switch (pos) {
            case 0:
                this.operator = this.createEndNode(this.operator, node, this, 0);
                break;
            case 1:
                this.left = this.createEndNode(this.left, node, this, 1);
                break;
            case 2:
                this.right = this.createEndNode(this.right, node, this, 2);
        }
    }
    accept(visitor) {
        visitor.onBinaryExprNode(this);
    }
    clone() {
        return new BinaryExprNode(this.left, this.right, this.operator);
    }
    isLeaf() {
        return false;
    }
    removeReduction() {
        super.removeReduction();
        this.operator = this._nodes[0];
        this.left = this._nodes[1];
        this.right = this._nodes[2];
    }
    deapCopy() {
        return new BinaryExprNode(this.left.deapCopy(), this.right.deapCopy(), this.operator.deapCopy());
    }
}
exports.BinaryExprNode = BinaryExprNode;
class FuncNode extends InnerNode {
    constructor(func, args) {
        super();
        this.func = this.assignNode(func, this, 0);
        this.args = this.assignNode(args, this, 1);
    }
    print() {
        return "(" + this.func.print() + " " + this.args.print() + ")";
    }
    loadVariable(variable, node) {
        if (this.func.loadVariable(variable, node))
            return true;
        return this.args.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        if (returning) {
            if (!(this.parent instanceof NullNode))
                this.parent.notifyUpdate(this._position, node, true);
        }
        else {
            switch (pos) {
                case 0:
                    this.func = this.createEndNode(this.func, node, this, 1);
                    break;
                case 1:
                    this.args = this.createEndNode(this.args, node, this, 1);
                    break;
            }
        }
    }
    accept(visitor) {
        visitor.onFuncNode(this);
    }
    clone() {
        return new FuncNode(this.func, this.args);
    }
    isLeaf() {
        return false;
    }
    removeReduction() {
        super.removeReduction();
        this.func = this._nodes[0];
        this.args = this._nodes[1];
    }
    deapCopy() {
        return new FuncNode(this.func.deapCopy(), this.args.deapCopy());
    }
}
exports.FuncNode = FuncNode;
class LambdaNode extends InnerNode {
    constructor(vars, body) {
        super();
        this.vars = this.assignNode(vars, this, 0);
        this.body = this.assignNode(body, this, 1);
    }
    print() {
        return "(lambda (" + this.vars.print() + ")" + this.body.print() + ")";
    }
    loadVariable(variable, node) {
        return this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        switch (pos) {
            case 0:
                this.vars = this.createEndNode(this.vars, node, this, 0);
                break;
            case 1:
                this.body = this.createEndNode(this.body, node, this, 1);
                break;
        }
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
    removeReduction() {
        super.removeReduction();
        this.vars = this._nodes[0];
        this.body = this._nodes[1];
    }
    deapCopy() {
        return new LambdaNode(this.vars.deapCopy(), this.body.deapCopy());
    }
}
exports.LambdaNode = LambdaNode;
class CompositeNode extends InnerNode {
    constructor(items) {
        super();
        let pos = 0;
        this.items = items.map(item => this.assignNode(item, this, pos++));
    }
    addItemBack(item) {
        item.position = this.items.length;
        item.parent = this;
        this.items.push(item);
        this._nodes.push(item);
    }
    addItemFront(item) {
        item.position = 0;
        item.parent = this;
        this.items.forEach(item => item.position++);
        this.items.unshift(item);
        this._nodes.unshift(item);
    }
    popFront() {
        this.items.shift();
        this._nodes.shift();
        this.items.forEach(item => item.position--);
    }
    print() {
        if (this.items.length == 0)
            return "";
        return (this.items.map(item => item.print() + " ").reduce((acc, str) => { return acc += str; })).slice(0, -1);
    }
    loadVariable(variable, node) {
        let acc = new CompositeNode(Array());
        let changed = false;
        this.items.forEach(item => {
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
    notifyUpdate(pos, node, returning) {
        this.items[pos] = this.createEndNode(this.items[pos], node, this, pos);
    }
    accept(visitor) {
        visitor.onCompositeNode(this);
    }
    clone() {
        return new CompositeNode(this.items.map(item => item));
    }
    isLeaf() {
        return false;
    }
    setColour(colour) {
        this.items.forEach(item => item.setColour(colour));
    }
    removeReduction() {
        super.removeReduction();
        let i = 0;
        this.items.forEach(item => this.items[i] = this._nodes[i++]);
    }
    deapCopy() {
        return new CompositeNode(this.items.map(item => item.deapCopy()));
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
    notifyUpdate(pos, node, returning) {
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
    notifyUpdate(pos, node, returning) {
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
    notifyUpdate(pos, node, returning) {
    }
    accept(visitor) {
        visitor.onStringNode(this);
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
    notifyUpdate(pos, node, returning) {
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
    constructor(arr) {
        super();
        this.items = this.assignNode(new CompositeNode(arr), this, 0);
    }
    print() {
        return "(" + this.items.print() + ")";
    }
    notifyUpdate(pos, node, returning) {
        this.items = this.createEndNode(this.items, node, this, 0);
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
    constructor(names, second, body) {
        super();
        this.names = this.assignNode(names, this, 0);
        this.second = this.assignNode(second, this, 1);
        this.body = this.assignNode(body, this, 2);
    }
    print() {
        return "(let" + "(" + this.names.print() + ")\n(" + this.second.print() + ")\n" + this.body.print() + ")";
    }
    loadVariable(variable, node) {
        if (this.names.loadVariable(variable, node))
            return true;
        if (this.second.loadVariable(variable, node))
            return true;
        return this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        switch (pos) {
            case 0:
                this.names = this.createEndNode(this.names, node, this, 0);
                break;
            case 1:
                this.second = this.createEndNode(this.second, node, this, 1);
                break;
            case 2:
                this.body = this.createEndNode(this.body, node, this, 2);
                break;
        }
    }
    accept(visitor) {
        visitor.onLetNode(this);
    }
    clone() {
        return new LetNode(this.names, this.second, this.body);
    }
    isLeaf() {
        return false;
    }
    removeReduction() {
        super.removeReduction();
        this.names = this._nodes[0];
        this.second = this._nodes[1];
        this.body = this._nodes[2];
    }
    deapCopy() {
        return new LetNode(this.names.deapCopy(), this.second.deapCopy(), this.body.deapCopy());
    }
}
exports.LetNode = LetNode;
class CallNode extends InnerNode {
    constructor(body) {
        super();
        this.body = this.assignNode(body, this, 0);
    }
    print() {
        return this.body.print();
    }
    loadVariable(variable, node) {
        return this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
    }
    accept(visitor) {
        visitor.onCallNode(this);
    }
    clone() {
        return new CallNode(this.body);
    }
    isLeaf() {
        return false;
    }
    removeReduction() {
        super.removeReduction();
        this.body = this._nodes[0];
    }
    deapCopy() {
        return new CallNode(this.body.deapCopy());
    }
}
exports.CallNode = CallNode;
class EndNode extends InnerNode {
    constructor(next, reduced) {
        super();
        this.next = this.assignNode(next, this, 0);
        this.reduced = this.assignNode(reduced, this, 1);
    }
    loadVariable(variable, node) {
        return this.reduced.loadVariable(variable, node);
    }
    notifyUpdate(pos, node, returning) {
        if (!(this.parent instanceof NullNode))
            this.parent.notifyUpdate(this._position, node, returning);
    }
    print() {
        return this.reduced.print();
    }
    accept(visitor) {
        visitor.onEndNode(this);
    }
    isLeaf() {
        return false;
    }
    setColour(colour) {
        this.next.setColour(colour);
    }
    deapCopy() {
        return new EndNode(this.next.deapCopy(), this.reduced.deapCopy());
    }
}
exports.EndNode = EndNode;
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
    notifyUpdate(pos, node, returning) {
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