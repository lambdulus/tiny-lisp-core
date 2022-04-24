import { InnerNode } from "../AST/AST";
import { ColourType } from "./ColourType";
import { SECDElementType } from "./SECDElementType";
export declare abstract class SECDElement {
    get type(): SECDElementType;
    get colour(): ColourType;
    set colour(value: ColourType);
    get node(): InnerNode;
    set node(value: InnerNode);
    protected _node: InnerNode;
    protected _colour: ColourType;
    protected _type: SECDElementType;
    constructor(type: SECDElementType);
    abstract setNode(node: InnerNode): void;
    abstract getNode(): InnerNode;
    removeReduction(): void;
    abstract clone(): SECDElement;
    abstract print(): string;
}
