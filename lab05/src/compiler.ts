import { c as C, Op, I32 } from "@tvm/wasm";
import { Expr } from "@tvm/lab04";
import { buildOneFunctionModule, Fn } from "./emitHelper";
const { i32, get_local } = C;

export function getVariables(e: Expr): string[] {
  switch (e.type) {
    case "num":
      return [];

    case "var":
      return [e.value];

    case "unary":
      return getVariables(e.arg);

    case "binary":
      const result = getVariables(e.left);

      for (const item of getVariables(e.right)) {
        if (!result.includes(item)) {
          result.push(item);
        }
      }

      return result;

    default:
      throw new Error("Uknown type");
  }
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
    case "num":
      return i32.const(e.value);

    case "var":
      const index = args.indexOf(e.value);
      if (index === -1) {
        throw new WebAssembly.RuntimeError("Var doesn't found");
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
          throw new Error("Unkdown operation");
      }
    default:
      throw new Error("Uknown expr type");
  }
}
