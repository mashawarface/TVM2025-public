import { Expr } from "../../lab04";

export function cost(e: Expr): number {
  switch (e.type) {
    case "num":
      return 0;
    case "var":
      return 1;
    case "binary":
      return 1 + cost(e.left) + cost(e.right);
    case "unary":
      return 1 + cost(e.arg);
    default:
      throw new Error(`Uknown expression type: ${(e as any).type}!`);
  }
}
