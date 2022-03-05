"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const InstructionShortcut_1 = require("../utility/instructions/InstructionShortcut");
const ColourType_1 = require("../utility/SECD/ColourType");
class Node {
    constructor() {
        this._colour = ColourType_1.ColourType.None;
        this._mouseOver = false;
        this._nodes = Array();
    }
    get colour() {
        throw new Error("Method not implemented.");
    }
    set colour(value) {
        throw new Error("Method not implemented.");
    }
    get mouseOver() {
        return false;
    }
    set mouseOver(value) {
        throw new Error("Method not implemented.");
    }
    createEndNode(next, reduced) {
        if (next instanceof EndNode)
            return new EndNode(next.next.clone(), reduced);
        return new EndNode(next.clone(), reduced);
    }
}
exports.Node = Node;
class TopNode extends Node {
    constructor(node, functions) {
        super();
        this.node = node;
        this.node.parent = this;
        this.node.position = 0;
        this.functions = functions;
        let i = 0;
        this.functions.forEach(func => {
            func.parent = this;
            func.position = ++i;
        });
        this._nodes.push(this.node);
        this.functions.forEach(func => this._nodes.push(func));
    }
    loadVariable(variable, node) {
    }
    notifyUpdate(pos, node) {
        this.node = new EndNode(this.node, node);
        this.node.parent = this;
        this.node.position = 0;
    }
    print() {
        return this.functions.map(func => func.print() + '\n').join("") + this.node.print();
    }
    accept(visitor) {
        visitor.onTopNode(this);
    }
    update(node) {
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
        this._mouseOver = false;
        this._position = 0;
    }
    get mouseOver() {
        return this._mouseOver;
    }
    set mouseOver(value) {
        this._mouseOver = value;
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
    print() {
        throw new Error("Method not implemented.");
    }
    clean() {
        this._colour = ColourType_1.ColourType.None;
        this._nodes.forEach(node => node.clean());
    }
    update(node) {
        if (typeof this._parent != "undefined")
            this._parent.notifyUpdate(this._position, node);
    }
    setMouseOver(over) {
        this._mouseOver = over;
        let node = this.parent;
        do {
            if (node instanceof InnerNode) {
                if (node instanceof EndNode)
                    if (node.mouseOver == over)
                        node.setMouseOver(over);
                node = node.parent;
            }
            else
                return;
        } while (typeof (node) != "undefined");
    }
    setColour(colour) {
        this._colour = colour;
    }
    clone() {
        return this;
    }
    clearEndNode() {
        this._nodes.forEach(node => {
            if (node instanceof EndNode)
                node = node.next;
            node.clearEndNode();
        });
    }
}
exports.InnerNode = InnerNode;
class MainNode extends InnerNode {
    constructor(node) {
        super();
        this.node = node;
        this.node.parent = this;
        this.node.position = 0;
        this._nodes.push(this.node);
    }
    print() {
        return this.node.print();
    }
    accept(visitor) {
        return visitor.onMainNode(this);
    }
    loadVariable(variable, node) {
        this.node.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
    }
    setColour(colour) {
        this.node.setColour(colour);
    }
}
exports.MainNode = MainNode;
class DefineNode extends InnerNode {
    constructor(name, vars, body) {
        super();
        this.name = name;
        this.vars = vars;
        this.vars.parent = this;
        this.vars.position = 0;
        this.body = body;
        this.body.parent = this;
        this.body.position = 1;
        this._nodes.push(this.vars);
        this._nodes.push(this.body);
    }
    print() {
        return '(define ' + this.name + '(' + this.vars.print() + ')\n\t' + this.body.print() + ')\n';
    }
    accept(visitor) {
        return visitor.onDefineNode(this);
    }
    loadVariable(variable, node) {
        this.vars.loadVariable(variable, node);
        this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
    }
}
exports.DefineNode = DefineNode;
class IfNode extends InnerNode {
    constructor(condition, node1, node2) {
        super();
        this.condition = condition;
        this.condition.parent = this;
        this.condition.position = 0;
        this.left = node1;
        this.left.parent = this;
        this.left.position = 1;
        this.right = node2;
        this.right.parent = this;
        this.right.position = 2;
        this._nodes.push(this.condition);
        this._nodes.push(this.left);
        this._nodes.push(this.right);
    }
    print() {
        return "(if " + this.condition.print() + " " + this.left.print() + " " + this.right.print() + " ";
    }
    loadVariable(variable, node) {
        this.condition.loadVariable(variable, node);
        this.left.loadVariable(variable, node);
        this.right.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        switch (pos) {
            case 0:
                this.condition = this.createEndNode(this.condition, node);
                this.condition.parent = this;
                this.condition.position = 0;
                break;
            case 1:
                this.left = this.createEndNode(this.left, node);
                this.left.parent = this;
                this.left.position = 1;
                break;
            case 2:
                this.right = this.createEndNode(this.right, node);
                this.right.parent = this;
                this.right.position = 2;
                break;
        }
    }
    accept(visitor) {
        visitor.onIfNode(this);
    }
    clone() {
        return new IfNode(this.condition, this.left, this.right);
    }
}
exports.IfNode = IfNode;
class UnaryExprNode extends InnerNode {
    constructor(operator, node) {
        super();
        this.operator = operator;
        this.operator.parent = this;
        this.operator.position = 0;
        this.expr = node;
        this.expr.parent = this;
        this.expr.position = 1;
        this._nodes.push(this.operator);
        this._nodes.push(this.expr);
    }
    print() {
        return "(" + this.operator.print() + " " + this.expr.print() + ")";
    }
    loadVariable(variable, node) {
        this.expr.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        this.expr = this.createEndNode(this.expr, node);
        this.expr.parent = this;
        this.expr.position = 0;
    }
    accept(visitor) {
        visitor.onUnaryExprNode(this);
    }
    clone() {
        return new UnaryExprNode(this.operator, this.expr);
    }
}
exports.UnaryExprNode = UnaryExprNode;
class BinaryExprNode extends InnerNode {
    constructor(node1, node2, operator) {
        super();
        this.operator = operator;
        this.operator.parent = this;
        this.operator.position = 0;
        this.left = node1;
        this.left.parent = this;
        this.left.position = 1;
        this.right = node2;
        this.right.parent = this;
        this.right.position = 2;
        this._nodes.push(this.operator);
        this._nodes.push(this.left);
        this._nodes.push(this.right);
    }
    print() {
        return '(' + this.operator.print() + ' ' + this.left.print() + ' ' + this.right.print() + ')';
    }
    loadVariable(variable, node) {
        this.operator.loadVariable(variable, node);
        this.left.loadVariable(variable, node);
        this.right.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        switch (pos) {
            case 0:
                this.operator = this.createEndNode(this.operator, node);
                this.operator.parent = this;
                this.operator.position = 0;
                break;
            case 1:
                this.left = this.createEndNode(this.left, node);
                this.left.parent = this;
                this.left.position = 1;
                break;
            case 2:
                this.right = this.createEndNode(this.right, node);
                this.right.parent = this;
                this.right.position = 2;
        }
    }
    accept(visitor) {
        visitor.onBinaryExprNode(this);
    }
    clone() {
        return new BinaryExprNode(this.operator, this.left, this.right);
    }
}
exports.BinaryExprNode = BinaryExprNode;
class FuncNode extends InnerNode {
    constructor(func, args) {
        super();
        this.func = func;
        this.func.parent = this;
        this.func.position = 0;
        this.args = args;
        this.args.parent = this;
        this.args.position = 1;
        this._nodes.push(this.func);
        this._nodes.push(this.args);
    }
    print() {
        return "(" + this.func.print() + " " + this.args.print() + ")";
    }
    loadVariable(variable, node) {
        this.func.loadVariable(variable, node);
        this.args.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        if (pos == 1) {
            this.args = this.createEndNode(this.args, node);
            this.args.parent = this;
            this.args.position = 1;
        }
        else if (typeof this._parent != "undefined")
            this._parent.notifyUpdate(this._position, node);
    }
    accept(visitor) {
        visitor.onFuncNode(this);
    }
    clone() {
        return new FuncNode(this.args, this.func);
    }
}
exports.FuncNode = FuncNode;
class LambdaNode extends InnerNode {
    constructor(vars, body) {
        super();
        this.vars = vars;
        this.vars.parent = this;
        this.vars.position = 0;
        this.body = body;
        this.body.parent = this;
        this.body.position = 1;
        this._nodes.push(this.vars);
        this._nodes.push(this.body);
    }
    print() {
        return "(lambda (" + this.vars.print() + ")" + this.body.print() + ")";
    }
    loadVariable(variable, node) {
        this.vars.loadVariable(variable, node);
        this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        switch (pos) {
            case 0:
                this.vars = this.createEndNode(this.vars, node);
                this.vars.parent = this;
                this.vars.position = 0;
                break;
            case 1:
                this.body = this.createEndNode(this.body, node);
                this.body.parent = this;
                this.body.position = 1;
                break;
        }
    }
    accept(visitor) {
        visitor.onLambdaNode(this);
    }
    clone() {
        return new LambdaNode(this.vars, this.body);
    }
}
exports.LambdaNode = LambdaNode;
class CompositeNode extends InnerNode {
    constructor(items) {
        super();
        this.items = items;
        let pos = 0;
        this.items.forEach(item => {
            item.position = pos++;
            item.parent = this;
        });
        this._nodes.forEach(item => this._nodes.push(item));
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
    print() {
        if (this.items.length == 0)
            return "";
        return (this.items.map(item => item.print() + " ").reduce((acc, str) => { return acc += str; })).slice(0, -1);
    }
    loadVariable(variable, node) {
        let acc = new CompositeNode(Array());
        let changed = false;
        this.items.forEach(item => {
            item.loadVariable(variable, node);
            if (item instanceof VarNode) {
                if (item.variable == variable) {
                    acc.addItemBack(node);
                    changed = true;
                }
                else
                    acc.addItemBack(item);
            }
            else if (item instanceof ValueNode && node instanceof ValueNode) {
                if (item.value == node.value) {
                    acc.addItemBack(node);
                    changed = true;
                }
                else
                    acc.addItemBack(item);
            }
            else
                acc.addItemBack(item);
            return acc;
        });
        if (changed)
            if (typeof this._parent != "undefined")
                this._parent.notifyUpdate(this._position, acc);
    }
    notifyUpdate(pos, node) {
        this.items[pos] = this.createEndNode(this.items[pos], node);
        this.items[pos].parent = this;
        this.items[pos].position = pos;
    }
    accept(visitor) {
        visitor.onCompositeNode(this);
    }
    clone() {
        return new CompositeNode(this.items.map(item => item));
    }
}
exports.CompositeNode = CompositeNode;
class VarNode extends InnerNode {
    constructor(variable) {
        super();
        this.variable = variable;
    }
    print() {
        return this.variable;
    }
    loadVariable(variable, node) {
        if (this.variable == variable)
            this.update(node);
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onVarNode(this);
    }
}
exports.VarNode = VarNode;
class ValueNode extends InnerNode {
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
    loadVariable(variable, node) {
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onValueNode(this);
    }
}
exports.ValueNode = ValueNode;
class StringNode extends InnerNode {
    constructor(str) {
        super();
        this.str = str;
    }
    print() {
        return "\"" + this.str + "\"";
    }
    loadVariable(variable, node) {
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onStringNode(this);
    }
}
exports.StringNode = StringNode;
class OperatorNode extends InnerNode {
    constructor(operator) {
        super();
        this.operator = operator;
    }
    print() {
        return InstructionShortcut_1.InstructionShortcut[this.operator];
    }
    loadVariable(variable, node) {
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onOperatorNode(this);
    }
    clone() {
        return new OperatorNode(this.operator);
    }
}
exports.OperatorNode = OperatorNode;
class ListNode extends InnerNode {
    constructor(arr) {
        super();
        this.items = new CompositeNode(arr);
    }
    print() {
        return "(" + this.items.print() + ")";
    }
    loadVariable(variable, node) {
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onListNode(this);
    }
}
exports.ListNode = ListNode;
class LetNode extends InnerNode {
    constructor(names, second, body) {
        super();
        this.names = names;
        this.names.parent = this;
        this.names.position = 0;
        this.second = second;
        this.second.parent = this;
        this.second.position = 1;
        this.body = body;
        this.body.parent = this;
        this.body.position = 2;
        this._nodes.push(this.names);
        this._nodes.push(this.second);
        this._nodes.push(this.body);
    }
    print() {
        return "(let" + "(" + this.names.print() + ")\n(" + this.second.print() + ")\n" + this.body.print() + ")";
    }
    loadVariable(variable, node) {
        this.names.loadVariable(variable, node);
        this.second.loadVariable(variable, node);
        this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onLetNode(this);
    }
    clone() {
        return new LetNode(this.names, this.second, this.body);
    }
}
exports.LetNode = LetNode;
class CallNode extends InnerNode {
    constructor(body) {
        super();
        this.body = body;
        this.body.parent = this;
        this.body.position = 0;
        this._nodes.push(this.body);
    }
    print() {
        return this.body.print();
    }
    loadVariable(variable, node) {
        this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onCallNode(this);
    }
    clone() {
        return new CallNode(this.body);
    }
}
exports.CallNode = CallNode;
class EndNode extends InnerNode {
    constructor(next, reduced) {
        super();
        this.next = next;
        this.next.parent = this;
        this.next.position = 0;
        this.reduced = reduced;
        this.reduced.parent = this;
        this.reduced.position = 1;
        this._nodes.push(this.next);
        this._nodes.push(this.reduced);
    }
    loadVariable(variable, node) {
        this.reduced.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        if (typeof this._parent != "undefined")
            this._parent.notifyUpdate(this._position, node);
    }
    print() {
        return this.reduced.print();
    }
    accept(visitor) {
        visitor.onEndNode(this);
    }
    setMouseOver(over) {
        console.log("END NODE in mouseOver", over);
        this.reduced.mouseOver = over;
        this.next.mouseOver = over;
    }
}
exports.EndNode = EndNode;
//# sourceMappingURL=AST.js.map