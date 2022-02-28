"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndNode = exports.CallNode = exports.LetNode = exports.ListNode = exports.OperatorNode = exports.StringNode = exports.ValueNode = exports.VarNode = exports.CompositeNode = exports.LambdaNode = exports.FuncNode = exports.BinaryExprNode = exports.UnaryExprNode = exports.IfNode = exports.DefineNode = exports.MainNode = exports.InnerNode = exports.TopNode = exports.Node = exports.Position = void 0;
const InstructionShortcut_1 = require("../utility/instructions/InstructionShortcut");
const ColourType_1 = require("../utility/SECD/ColourType");
var Position;
(function (Position) {
    Position[Position["Only"] = 0] = "Only";
    Position[Position["Left"] = 1] = "Left";
    Position[Position["Right"] = 2] = "Right";
    Position[Position["Cond"] = 3] = "Cond";
})(Position = exports.Position || (exports.Position = {}));
class Node {
    constructor() {
        this._colour = ColourType_1.ColourType.None;
        this._mouseOver = false;
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
}
exports.Node = Node;
class TopNode extends Node {
    constructor(node, functions) {
        super();
        this.node = node;
        this.node.parent = this;
        this.node.position = Position.Only;
        this.functions = functions;
        this.functions.forEach(func => {
            func.parent = this;
            func.position = Position.Only;
        });
    }
    loadVariable(variable, node) {
    }
    notifyUpdate(pos, node) {
        this.node = new EndNode(this.node, node);
        this.node.parent = this;
        this.node.position = Position.Only;
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
    }
    update(node) {
        if (this._position == null)
            this._position = Position.Only;
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
}
exports.InnerNode = InnerNode;
class MainNode extends InnerNode {
    constructor(node) {
        super();
        this.node = node;
        this.node.parent = this;
        this.node.position = Position.Only;
    }
    print() {
        return this.node.print();
    }
    clean() {
        this.node.clean();
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
        this.vars.position = Position.Left;
        this.body = body;
        this.body.parent = this;
        this.body.position = Position.Right;
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
        this.condition.position = Position.Cond;
        this.left = node1;
        this.left.parent = this;
        this.left.position = Position.Left;
        this.right = node2;
        this.right.parent = this;
        this.right.position = Position.Right;
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
            case Position.Cond:
                this.condition = new EndNode(this.condition, node);
                this.condition.parent = this;
                this.condition.position = Position.Cond;
                break;
            case Position.Left:
                this.left = new EndNode(this.left, node);
                this.left.parent = this;
                this.left.position = Position.Left;
                break;
            case Position.Right:
                this.right = new EndNode(this.right, node);
                this.right.parent = this;
                this.right.position = Position.Right;
                break;
        }
    }
    clean() {
        super.clean();
        this.condition.clean();
        this.left.clean();
        this.right.clean();
    }
    accept(visitor) {
        visitor.onIfNode(this);
    }
}
exports.IfNode = IfNode;
class UnaryExprNode extends InnerNode {
    constructor(node, operator) {
        super();
        this.expr = node;
        this.expr.parent = this;
        this.expr.position = Position.Only;
        this.operator = operator;
        this.operator.parent = this;
        this.operator.position = Position.Only;
    }
    print() {
        return "(" + this.operator.print() + " " + this.expr.print() + ")";
    }
    loadVariable(variable, node) {
        this.expr.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        this.expr = new EndNode(this.expr, node);
        this.expr.parent = this;
        this.expr.position = Position.Only;
    }
    clean() {
        super.clean();
        this.expr.clean();
    }
    accept(visitor) {
        visitor.onUnaryExprNode(this);
    }
}
exports.UnaryExprNode = UnaryExprNode;
class BinaryExprNode extends InnerNode {
    constructor(node1, node2, operator) {
        super();
        this.left = node1;
        this.left.parent = this;
        this.left.position = Position.Left;
        this.right = node2;
        this.right.parent = this;
        this.right.position = Position.Right;
        this.operator = operator;
        this.operator.parent = this;
        this.operator.position = Position.Only;
    }
    print() {
        return '(' + this.operator.print() + ' ' + this.left.print() + ' ' + this.right.print() + ')';
    }
    loadVariable(variable, node) {
        this.left.loadVariable(variable, node);
        this.right.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        switch (pos) {
            case Position.Left:
                this.left = new EndNode(this.left, node);
                this.left.parent = this;
                this.left.position = Position.Left;
                break;
            case Position.Right:
                this.right = new EndNode(this.right, node);
                this.right.parent = this;
                this.right.position = Position.Right;
        }
    }
    clean() {
        super.clean();
        this.left.clean();
        this.right.clean();
    }
    accept(visitor) {
        visitor.onBinaryExprNode(this);
    }
}
exports.BinaryExprNode = BinaryExprNode;
class FuncNode extends InnerNode {
    constructor(func, args) {
        super();
        this.func = func;
        this.func.parent = this;
        this.func.position = Position.Left;
        this.args = args;
        this.args.parent = this;
        this.args.position = Position.Right;
    }
    print() {
        return "(" + this.func.print() + " " + this.args.print() + ")";
    }
    loadVariable(variable, node) {
        this.func.loadVariable(variable, node);
        this.args.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        if (typeof this._parent != "undefined" && typeof this._position != "undefined")
            this._parent.notifyUpdate(this._position, node);
    }
    clean() {
        super.clean();
        this.func.clean();
        this.args.clean();
    }
    accept(visitor) {
        visitor.onFuncNode(this);
    }
}
exports.FuncNode = FuncNode;
class LambdaNode extends InnerNode {
    constructor(vars, body) {
        super();
        this.vars = vars;
        this.vars.parent = this;
        this.body = body;
        this.body.parent = this;
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
            case Position.Left:
                this.vars = new EndNode(this.vars, node);
                this.vars.parent = this;
                this.vars.position = Position.Left;
                break;
            case Position.Right:
                this.body = new EndNode(this.body, node);
                this.body.parent = this;
                this.body.position = Position.Right;
                break;
        }
    }
    clean() {
        super.clean();
        this.vars.clean();
        this.body.clean();
    }
    accept(visitor) {
        visitor.onLambdaNode(this);
    }
}
exports.LambdaNode = LambdaNode;
class CompositeNode extends InnerNode {
    constructor(items) {
        super();
        this.items = items;
        this.items.forEach(item => {
            item.position = Position.Only;
            item.parent = this;
        });
    }
    addItemBack(item) {
        item.position = Position.Only;
        item.parent = this;
        this.items.push(item);
    }
    addItemFront(item) {
        item.position = Position.Only;
        item.parent = this;
        this.items.unshift(item);
    }
    print() {
        if (this.items.length == 0)
            return "";
        return (this.items.map(item => item.print() + " ").reduce((acc, str) => { return acc += str; })).slice(0, -1);
    }
    loadVariable(variable, node) {
        let acc = new CompositeNode(Array());
        this.items.forEach(item => {
            if (item instanceof VarNode) {
                if (item.variable == variable) {
                    return acc;
                }
            }
            else if (item instanceof ValueNode && node instanceof ValueNode) {
                if (item.value == node.value) {
                    return acc;
                }
            }
            acc.addItemBack(item);
            return acc;
        });
        if (typeof this._parent != "undefined" && typeof this._position != "undefined")
            this._parent.notifyUpdate(this._position, acc);
    }
    notifyUpdate(pos, node) {
    }
    clean() {
        super.clean();
        this.items.forEach(item => item.colour = ColourType_1.ColourType.None);
    }
    accept(visitor) {
        visitor.onCompositeNode(this);
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
        this.names.position = Position.Only;
        this.second = second;
        this.second.parent = this;
        this.second.position = Position.Only;
        this.body = body;
        this.body.parent = this;
        this.body.position = Position.Only;
    }
    print() {
        return "(let" + "(" + this.names.print() + ")\n(" + this.second.print() + ")\n" + this.body.print() + ")";
    }
    clean() {
        super.clean();
        this.names.clean();
        this.second.clean();
        this.body.clean();
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
}
exports.LetNode = LetNode;
class CallNode extends InnerNode {
    constructor(body) {
        super();
        this.body = body;
        this.body.parent = this;
        this.body.position = Position.Only;
    }
    print() {
        return this.body.print();
    }
    clean() {
        super.clean();
        this.body.clean();
    }
    loadVariable(variable, node) {
        this.body.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
    }
    accept(visitor) {
        visitor.onCallNode(this);
    }
}
exports.CallNode = CallNode;
class EndNode extends InnerNode {
    constructor(next, reduced) {
        super();
        this.next = next;
        this.next.parent = this;
        this.next.position = Position.Left;
        this.reduced = reduced;
        this.reduced.parent = this;
        this.reduced.position = Position.Right;
    }
    loadVariable(variable, node) {
        this.reduced.loadVariable(variable, node);
    }
    notifyUpdate(pos, node) {
        if (typeof this._parent != "undefined" && typeof this._position != "undefined")
            this._parent.notifyUpdate(this._position, node);
    }
    print() {
        return this.next.print();
    }
    clean() {
        super.clean();
        this.next.clean();
        this.reduced.clean();
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