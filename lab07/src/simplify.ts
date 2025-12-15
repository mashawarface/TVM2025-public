import { Expr, Number, Variable, BinaryOp, UnaryOp } from "../../lab04";
import { cost } from "./cost";

function simplifyRecursively(expr: Expr, identities: [Expr, Expr][]): Expr {
  if (expr.type === "num" || expr.type === "var") {
    return expr;
  }

  if (expr.type === "unary") {
    const arg = simplifyRecursively(expr.arg, identities);
    const folded = foldConstants({ type: "unary", arg });
    return searchBestByIdentities(folded, identities);
  }

  if (expr.type === "binary") {
    const left = simplifyRecursively(expr.left, identities);
    const right = simplifyRecursively(expr.right, identities);
    const folded = foldConstants({
      type: "binary",
      op: expr.op,
      left,
      right,
    });
    return searchBestByIdentities(folded, identities);
  }

  return expr;
}

function serialize(e: Expr): string {
  switch (e.type) {
    case "num":
      return `${e.value}`;
    case "var":
      return `${e.value}`;
    case "binary":
      return `${serialize(e.left)}${e.op}${serialize(e.right)}`;
    case "unary":
      return `-${serialize(e.arg)}`;
  }
}

function searchBestByIdentities(expr: Expr, identities: [Expr, Expr][]): Expr {
  const visited = new Set<string>();

  let bestExpr = expr;
  let bestCost = cost(expr);

  const queue: Array<{ expr: Expr; cost: number }> = [{ expr, cost: bestCost }];

  visited.add(serialize(expr));

  const MAX_ITER = 1000;
  const MAX_QUEUE = 1000;

  for (let i = 0; i < MAX_ITER && queue.length > 0; i++) {
    queue.sort((a, b) => a.cost - b.cost);
    const { expr: current } = queue.shift()!;
    const currentCost = cost(current);

    if (currentCost < bestCost) {
      bestExpr = current;
      bestCost = currentCost;
    }

    for (const [a, b] of identities) {
      for (const [pattern, replacement] of [
        [a, b],
        [b, a],
      ]) {
        const results = applyIdentityEverywhere(current, pattern, replacement);

        for (const r of results) {
          const key = serialize(r);
          if (visited.has(key)) continue;

          visited.add(key);
          const c = cost(r);

          if (c < bestCost) {
            bestExpr = r;
            bestCost = c;
          }

          queue.push({ expr: r, cost: c });
        }
      }
    }

    if (queue.length > MAX_QUEUE) {
      queue.sort((a, b) => a.cost - b.cost);
      queue.splice(MAX_QUEUE);
    }
  }

  return bestExpr;
}

function applyIdentityEverywhere(expr: Expr, from: Expr, to: Expr): Expr[] {
  const results: Expr[] = [];

  const match = matchPattern(from, expr, new Map());
  if (match) {
    const replaced = substitutePattern(to, match);
    const folded = foldConstants(replaced);
    if (!deepEqual(folded, expr)) {
      results.push(folded);
    }
  }

  if (expr.type === "unary") {
    for (const sub of applyIdentityEverywhere(expr.arg, from, to)) {
      results.push(foldConstants({ type: "unary", arg: sub }));
    }
  }

  if (expr.type === "binary") {
    for (const l of applyIdentityEverywhere(expr.left, from, to)) {
      results.push(
        foldConstants({
          type: "binary",
          op: expr.op,
          left: l,
          right: expr.right,
        })
      );
    }

    for (const r of applyIdentityEverywhere(expr.right, from, to)) {
      results.push(
        foldConstants({
          type: "binary",
          op: expr.op,
          left: expr.left,
          right: r,
        })
      );
    }
  }

  return results;
}

function foldConstants(expr: Expr): Expr {
  if (expr.type === "num" || expr.type === "var") return expr;

  if (expr.type === "unary") {
    const arg = foldConstants(expr.arg);

    if (arg.type === "unary") {
      return arg.arg;
    }

    if (arg.type === "num") {
      return { type: "num", value: -arg.value };
    }

    return { type: "unary", arg };
  }

  if (expr.type === "binary") {
    const l = foldConstants(expr.left);
    const r = foldConstants(expr.right);

    if (l.type === "num" && r.type === "num") {
      switch (expr.op) {
        case "+":
          return { type: "num", value: l.value + r.value };
        case "-":
          return { type: "num", value: l.value - r.value };
        case "*":
          return { type: "num", value: l.value * r.value };
        case "/":
          return { type: "num", value: l.value / r.value };
      }
    }

    if (expr.op === "*") {
      if (l.type === "num" && l.value === 0) return { type: "num", value: 0 };
      if (r.type === "num" && r.value === 0) return { type: "num", value: 0 };
      if (l.type === "num" && l.value === 1) return r;
      if (r.type === "num" && r.value === 1) return l;
    }

    if (expr.op === "+") {
      if (l.type === "num" && l.value === 0) return r;
      if (r.type === "num" && r.value === 0) return l;
    }

    if (expr.op === "-") {
      if (r.type === "num" && r.value === 0) return l;
      if (deepEqual(l, r)) return { type: "num", value: 0 };
    }

    if (expr.op === "/") {
      if (l.type === "num" && l.value === 0) return { type: "num", value: 0 };
      if (r.type === "num" && r.value === 1) return l;
    }

    return { type: "binary", op: expr.op, left: l, right: r };
  }

  return expr;
}

type MatchEnv = Map<string, Expr>;

function matchPattern(
  pattern: Expr,
  expr: Expr,
  env: MatchEnv
): MatchEnv | undefined {
  switch (pattern.type) {
    case "num":
      return expr.type === "num" && pattern.value === expr.value
        ? env
        : undefined;

    case "var":
      const bound = env.get(pattern.value);
      if (bound) {
        return deepEqual(bound, expr) ? env : undefined;
      }
      const next = new Map(env);
      next.set(pattern.value, expr);
      return next;

    case "binary":
      if (expr.type !== "binary" || pattern.op !== expr.op) return undefined;
      const left = matchPattern(pattern.left, expr.left, env);
      return left ? matchPattern(pattern.right, expr.right, left) : undefined;

    case "unary":
      return expr.type === "unary"
        ? matchPattern(pattern.arg, expr.arg, env)
        : undefined;

    default:
      return undefined;
  }
}

function substitutePattern(template: Expr, env: MatchEnv): Expr {
  switch (template.type) {
    case "num":
      return { type: "num", value: template.value };

    case "var":
      const sub = env.get(template.value);
      return sub
        ? sub
        : { type: "var", value: template.value };

    case "binary":
      return {
        type: "binary",
        op: template.op,
        left: substitutePattern(template.left, env),
        right: substitutePattern(template.right, env),
      };

    case "unary":
      return { type: "unary", arg: substitutePattern(template.arg, env) };
  }
}

function deepEqual(a: Expr, b: Expr): boolean {
  if (a.type !== b.type) return false;

  if (a.type === "num" && b.type === "num") return a.value === b.value;
  if (a.type === "var" && b.type === "var") return a.value === b.value;

  if (a.type === "unary" && b.type === "unary") {
    return deepEqual(a.arg, b.arg);
  }

  if (a.type === "binary" && b.type === "binary") {
    return (
      a.op === b.op && deepEqual(a.left, b.left) && deepEqual(a.right, b.right)
    );
  }

  return false;
}

export function simplify(expr: Expr, identities: [Expr, Expr][]): Expr {
  return simplifyRecursively(expr, identities);
}
