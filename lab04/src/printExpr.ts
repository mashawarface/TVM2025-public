import { Expr, NumConst, Variable, BinaryOp, UnaryOp, Paren } from "./ast";

const PRECEDENCE: { [key: string]: number } = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "unary-": 3,
};

export function printExpr(expr: Expr, parentPrecedence: number = 0): string {
  switch (expr.type) {
    case "const":
      return expr.value.toString();

    case "var":
      return expr.value;

    case "paren":
      const innerExpr = expr.expr;

      if (
        innerExpr.type === "const" ||
        innerExpr.type === "var" ||
        innerExpr.type === "unary"
      ) {
        return printExpr(innerExpr, parentPrecedence);
      }

      if (innerExpr.type === "binary") {
        const innerPrecedence = PRECEDENCE[innerExpr.op];

        if (innerPrecedence > parentPrecedence) {
          return printExpr(innerExpr, parentPrecedence);
        }
      }

      return `(${printExpr(innerExpr)})`;

    case "unary":
      const unaryPrecedence = PRECEDENCE["unary-"];
      const argStr = printExpr(expr.arg, unaryPrecedence);
      const result = `-${argStr}`;
      return unaryPrecedence < parentPrecedence ? `(${result})` : result;

    case "binary":
      const currentPrecedence = PRECEDENCE[expr.op];

      const leftStr = printExpr(expr.left, currentPrecedence);
      const rightStr = printExpr(expr.right, currentPrecedence);

      const resultStr = `${leftStr} ${expr.op} ${rightStr}`;

      return currentPrecedence < parentPrecedence
        ? `(${resultStr})`
        : resultStr;

    default:
      throw new Error(`Unknown expression type: ${(expr as any).type}`);
  }
}
