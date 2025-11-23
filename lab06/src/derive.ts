import { BinaryOp, Expr, Number, UnaryOp } from "../../lab04";

function isZero(e: Expr): boolean {
  return e.type === "num" && e.value === 0;
}

function isOne(e: Expr): boolean {
  return e.type === "num" && e.value === 1;
}

function makeUnary(e: Expr): UnaryOp {
  return { type: "unary", arg: e };
}

function makeNumber(value: number): Number {
  return { type: "num", value };
}

function makeBinary(
  op: "+" | "-" | "*" | "/",
  left: Expr,
  right: Expr
): BinaryOp {
  return { type: "binary", op, left, right };
}

function simplifyUnary(e: Expr): Expr {
  if (isZero(e)) return makeNumber(0);
  if (e.type === "unary") return e.arg;
  if (e.type === "num") return makeNumber(-e.value);
  return makeUnary(e);
}

function simplifyAdd(left: Expr, right: Expr): Expr {
  if (isZero(left)) return right;
  if (isZero(right)) return left;
  if (left.type === "num" && right.type === "num")
    return makeNumber(left.value + right.value);

  return makeBinary("+", left, right);
}

function simplifySub(left: Expr, right: Expr): Expr {
  if (isZero(right)) return left;
  if (isZero(left)) return simplifyUnary(right);
  if (left.type === "num" && right.type === "num")
    return makeNumber(left.value - right.value);

  return makeBinary("-", left, right);
}

function simplifyMul(left: Expr, right: Expr): Expr {
  if (isZero(left) || isZero(right)) return makeNumber(0);
  if (isOne(left)) return right;
  if (isOne(right)) return left;
  if (left.type === "num" && right.type === "num")
    return makeNumber(left.value * right.value);
  if (left.type === "num" && left.value < 0)
    return makeUnary(makeBinary("*", makeNumber(-left.value), right));
  if (right.type === "num" && right.value < 0)
    return makeUnary(makeBinary("*", left, makeNumber(-right.value)));

  return makeBinary("*", left, right);
}

function simplifyDiv(left: Expr, right: Expr): Expr {
  if (isZero(left)) return makeNumber(0);
  if (isOne(right)) return left;
  if (left.type === "num" && right.type === "num")
    return makeNumber(left.value / right.value);
  if (left.type === "num" && left.value < 0)
    return makeUnary(makeBinary("/", makeNumber(-left.value), right));
  if (right.type === "num" && right.value < 0)
    return makeUnary(makeBinary("/", left, makeNumber(-right.value)));

  return makeBinary("/", left, right);
}

export function derive(e: Expr, varName: string): Expr {
  switch (e.type) {
    case "num":
      return makeNumber(0);

    case "var":
      return makeNumber(e.value === varName ? 1 : 0);

    case "unary":
      return simplifyUnary(derive(e.arg, varName));

    case "binary":
      const left = e.left,
        right = e.right;

      switch (e.op) {
        case "+":
          return simplifyAdd(derive(left, varName), derive(right, varName));

        case "-":
          return simplifySub(derive(left, varName), derive(right, varName));

        case "*":
          // (f*g)' = f'g + g'f
          return simplifyAdd(
            simplifyMul(derive(left, varName), right), // f'g
            simplifyMul(derive(right, varName), left) // g'f
          );

        case "/":
          // (f/g)' = (f'g - g'f)/(g*g)
          return simplifyDiv(
            simplifySub(
              simplifyMul(derive(left, varName), right), // f'g
              simplifyMul(derive(right, varName), left) // g'f
            ),
            simplifyMul(right, right) // g*g
          );

        default:
          throw new Error("Unknown op");
      }

    default:
      throw new Error("Unknown type");
  }
}
