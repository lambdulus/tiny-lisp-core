import { InnerNode } from "../../AST/AST";
import { ColourType } from "./ColourType";
import { HasNode } from "../../AST/HasNode";
import { SECDElementType } from "./SECDElementType";
export declare abstract class SECDElement implements HasNode {
    get type(): SECDElementType;
    get colour(): ColourType;
    set colour(value: ColourType);
    get node(): InnerNode;
    set node(value: InnerNode);
    protected _node: InnerNode;
    protected _colour: ColourType;
    protected _type: SECDElementType;
    constructor(type: SECDElementType);
    setNode(node: InnerNode): void;
    getNode(): InnerNode;
}
