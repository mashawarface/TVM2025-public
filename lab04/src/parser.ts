import { MatchResult } from "ohm-js";
import {
  arithGrammar,
  ArithmeticActionDict,
  ArithmeticSemantics,
  SyntaxError,
} from "../../lab03";
import { Expr, Number, Variable, BinaryOp, UnaryOp } from "./ast";

import { NonterminalNode } from "ohm-js";

function parseBinary(
  first: NonterminalNode,
  ops: NonterminalNode,
  rest: NonterminalNode
): BinaryOp {
  let res = first.parse() as BinaryOp;

  for (let i = 0; i < ops.children.length; i++) {
    const rightRes = rest.child(i).parse();
    const op = ops.child(i).sourceString as "+" | "-" | "*" | "/";

    res = {
      type: "binary",
      op: op,
      left: res,
      right: rightRes,
    };
  }

  return res;
}

export const getExprAst: ArithmeticActionDict<Expr> = {
  number(digits) {
    const value = parseInt(this.sourceString);
    return { type: "num", value } as Number;
  },

  variable(string) {
    const value = this.sourceString;
    return { type: "var", value } as Variable;
  },

  Atom(atom) {
    return atom.parse();
  },

  Paren(_lparen, expr, _rparen) {
    return expr.parse();
  },

  Sum: parseBinary,
  Mul: parseBinary,

  Neg_neg(_minus, expr) {
    return {
      type: "unary",
      arg: expr.parse(),
    } as UnaryOp;
  },

  Neg(expr) {
    return expr.parse();
  },
};

export const semantics = arithGrammar.createSemantics();
semantics.addOperation("parse()", getExprAst);

export interface ArithSemanticsExt extends ArithmeticSemantics {
  (match: MatchResult): ArithActionsExt;
}

export interface ArithActionsExt {
  parse(): Expr;
}

export function parseExpr(source: string): Expr {
  var match = arithGrammar.match(source);

  if (match.failed()) {
    throw new SyntaxError(match.message);
  }

  var sem = semantics as ArithSemanticsExt;

  return sem(match).parse();
}
