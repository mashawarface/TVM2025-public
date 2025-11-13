import { MatchResult } from "ohm-js";
import {
  arithGrammar,
  ArithmeticActionDict,
  ArithmeticSemantics,
  SyntaxError,
} from "../../lab03";
import { Expr, NumConst, Variable, BinaryOp, UnaryOp, Paren } from "./ast";
import { arithSemantics } from "lab03/src/calculate";

export const getExprAst: ArithmeticActionDict<Expr> = {
  number(digits) {
    const value = parseInt(this.sourceString);
    return { type: "const", value } as NumConst;
  },

  variable(string) {
    const value = this.sourceString;
    return { type: "var", value } as Variable;
  },

  Atom(atom) {
    return atom.parse();
  },

  Paren(_lparen, expr, _rparen) {
    return {
      type: "paren",
      expr: expr.parse(),
    } as Paren;
  },

  Sum(expr0, _addOp, expr2) {
    var res = expr0.parse();

    for (var i = 0; i < expr2.children.length; i++) {
      var rightRes = expr2.child(i).parse();
      var _op = _addOp.child(i).sourceString;

      res = {
        type: "binary",
        op: _op,
        left: res,
        right: rightRes,
      } as BinaryOp;
    }

    return res;
  },

  Mul(expr0, _mulOp, expr2) {
    var res = expr0.parse();

    for (var i = 0; i < expr2.children.length; i++) {
      var rightRes = expr2.child(i).parse();
      var _op = _mulOp.child(i).sourceString;

      if (_op === "/" && rightRes === 0) {
        throw new Error();
      }

      res = {
        type: "binary",
        op: _op,
        left: res,
        right: rightRes,
      } as BinaryOp;
    }

    return res;
  },

  Neg_neg(_minus, expr) {
    return {
      type: "unary",
      op: "-",
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
