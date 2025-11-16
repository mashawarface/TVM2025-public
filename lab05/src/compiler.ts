import { c as C, Op, I32 } from "@tvm/wasm";
import { Expr } from "@tvm/lab04";
import { buildOneFunctionModule, Fn } from "./emitHelper";
const { i32, get_local } = C;

function walk(expr: Expr, varSet: Set<string>, result: string[]): void {
  switch (expr.type) {
    case "const":
      return;

    case "var":
      if (!varSet.has(expr.value)) {
        varSet.add(expr.value);
        result.push(expr.value);
      }
      return;

    case "unary":
      walk(expr.arg, varSet, result);
      return;

    case "binary":
      walk(expr.left, varSet, result);
      walk(expr.right, varSet, result);
      return;
  }
}

export function getVariables(e: Expr): string[] {
  const varSet = new Set<string>();
  const result: string[] = [];

  walk(e, varSet, result);

  return result;
}

export async function buildFunction(
  e: Expr,
  variables: string[]
): Promise<Fn<number>> {
  let expr = wasm(e, variables);
  return await buildOneFunctionModule("test", variables.length, [expr]);
}

function wasm(e: Expr, args: string[]): Op<I32> {
  switch (e.type) {
    case "const":
      return i32.const(e.value);

    case "var":
      const index = args.indexOf(e.value);
      if (index === -1) {
        throw new WebAssembly.RuntimeError("Var doesn`t found: ${e.value}");
      }

      return get_local(i32, index);

    case "unary":
      return i32.sub(i32.const(0), wasm(e.arg, args));

    case "binary":
      const left = wasm(e.left, args);
      const right = wasm(e.right, args);

      switch (e.op) {
        case "+":
          return i32.add(left, right);

        case "-":
          return i32.sub(left, right);

        case "*":
          return i32.mul(left, right);

        case "/":
          return i32.div_s(left, right);

        default:
          throw new Error("Unkdown operation: ${e.op}");
      }
    default:
      throw new Error("Uknown expr type: ${e.type}");
  }
}
