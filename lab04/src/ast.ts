export type Expr = NumConst | Variable | BinaryOp | UnaryOp | Paren;

export interface NumConst {
  type: "const";
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
  op: "-";
  arg: Expr;
}

export interface Paren {
  type: "paren";
  expr: Expr;
}
