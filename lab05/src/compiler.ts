import { c as C, Op, I32 } from "@tvm/wasm";
import { Expr } from "@tvm/lab04";
import { buildOneFunctionModule, Fn } from "./emitHelper";
const { i32, get_local } = C;

export function getVariablesImpl(e: Expr, vars: Set<string>) {
  switch (e.type) {
    case "num":
      break;

    case "var":
      vars.add(e.value);
      break;

    case "unary":
      getVariablesImpl(e.arg, vars);
      break;

    case "binary":
      getVariablesImpl(e.left, vars);
      getVariablesImpl(e.right, vars);
      break;

    default:
      throw new Error("Uknown type");
  }
}

export function getVariables(e: Expr) {
  const vars = new Set<string>();

  getVariablesImpl(e, vars);

  return [...vars];
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
        throw new WebAssembly.RuntimeError(`Var '${e.value}' isn't found`);
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
