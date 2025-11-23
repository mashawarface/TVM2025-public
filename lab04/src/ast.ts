export type Expr = Number | Variable | BinaryOp | UnaryOp;

export interface Number {
  type: "num";
  value: number;
}

export interface Variable {
  type: "var";
  value: string;
}

export interface BinaryOp {
  type: "binary";
  op: "+" | "-" | "*" | "/";
  left: Expr;
  right: Expr;
}

export interface UnaryOp {
  type: "unary";
  arg: Expr;
}
