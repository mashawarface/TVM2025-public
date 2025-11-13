import { Expr, NumConst, Variable, BinaryOp, UnaryOp } from "./ast";

const PRECEDENCE: { [op: string]: number } = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
};

export function printExpr(
  expr: Expr,
  parentOp?: string,
  isRight: boolean = false
): string {
  switch (expr.type) {
    case "const":
      return expr.value.toString();

    case "var":
      return expr.value;

    case "unary":
      const argStr = printExpr(expr.arg, "unary-", false);
      if (parentOp && (parentOp === "+" || parentOp === "-")) {
        return `-${argStr}`;
      }
      return `-${argStr}`;

    case "binary":
      const needsParens =
        parentOp !== undefined &&
        (PRECEDENCE[parentOp] > PRECEDENCE[expr.op] ||
          (PRECEDENCE[parentOp] === PRECEDENCE[expr.op] &&
            isRight &&
            (parentOp !== expr.op || parentOp === "-" || parentOp === "/")));

      const leftStr = printExpr(expr.left, expr.op, false);
      const rightStr = printExpr(expr.right, expr.op, true);
      const result = `${leftStr} ${expr.op} ${rightStr}`;

      return needsParens ? `(${result})` : result;

    default:
      throw new Error(`Unknown expression type: ${(expr as any).type}`);
  }
}
