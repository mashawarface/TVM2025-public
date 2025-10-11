import { match } from "assert";
import grammar from "./rpn.ohm-bundle";
import { rpnSemantics } from "./semantics";

export function evaluate(source: string): number
{ 
    const res = grammar.match(source);

    if (res.failed()) {
        throw new SyntaxError(res.shortMessage);
    }

    return rpnSemantics(res).calculate();
}

export function maxStackDepth(source: string): number
{ 
    throw "Not implemented";
}

export class SyntaxError extends Error
{
}

