type FormulaNode =
  | { type: "number"; value: number }
  | { type: "variable"; name: string }
  | { type: "unary"; operator: "+" | "-"; value: FormulaNode }
  | { type: "binary"; operator: BinaryOperator; left: FormulaNode; right: FormulaNode }
  | { type: "call"; name: FormulaFunctionName; args: FormulaNode[] };

type BinaryOperator = "+" | "-" | "*" | "/" | "%" | "^";
type FormulaFunctionName = keyof typeof formulaFunctions;

type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: BinaryOperator | "+" | "-" }
  | { type: "leftParen" }
  | { type: "rightParen" }
  | { type: "comma" };

const formulaFunctions = {
  abs: (value: number) => Math.abs(value),
  ceil: (value: number) => Math.ceil(value),
  exp: (value: number) => Math.exp(value),
  floor: (value: number) => Math.floor(value),
  log: (value: number) => Math.log(value),
  max: (...values: number[]) => Math.max(...values),
  min: (...values: number[]) => Math.min(...values),
  pow: (base: number, exponent: number) => Math.pow(base, exponent),
  round: (value: number) => Math.round(value),
  sqrt: (value: number) => Math.sqrt(value),
} satisfies Record<string, (...args: number[]) => number>;
const formulaFunctionMap: Record<FormulaFunctionName, (...args: number[]) => number> =
  formulaFunctions;

const binaryPrecedence: Record<BinaryOperator, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "%": 2,
  "^": 3,
};

function isIdentifierStart(value: string) {
  return /[A-Za-z_]/.test(value);
}

function isIdentifierPart(value: string) {
  return /[A-Za-z0-9_]/.test(value);
}

function tokenizeFormula(formula: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (char === undefined || /\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/\d|\./.test(char)) {
      const start = index;
      index += 1;

      while (index < formula.length && /[\d.eE+-]/.test(formula[index] ?? "")) {
        const previous = formula[index - 1];
        const current = formula[index];

        if ((current === "+" || current === "-") && previous !== "e" && previous !== "E") {
          break;
        }

        index += 1;
      }

      const value = Number(formula.slice(start, index));

      if (!Number.isFinite(value)) {
        throw new Error("Invalid number in formula");
      }

      tokens.push({ type: "number", value });
      continue;
    }

    if (isIdentifierStart(char)) {
      const start = index;
      index += 1;

      while (index < formula.length && isIdentifierPart(formula[index] ?? "")) {
        index += 1;
      }

      tokens.push({ type: "identifier", value: formula.slice(start, index) });
      continue;
    }

    if (char === "[") {
      const end = formula.indexOf("]", index + 1);

      if (end === -1) {
        throw new Error("Unclosed column reference");
      }

      const value = formula.slice(index + 1, end).trim();

      if (value === "") {
        throw new Error("Empty column reference");
      }

      tokens.push({ type: "identifier", value });
      index = end + 1;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "leftParen" });
      index += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "rightParen" });
      index += 1;
      continue;
    }

    if (char === ",") {
      tokens.push({ type: "comma" });
      index += 1;
      continue;
    }

    if ("+-*/%^".includes(char)) {
      tokens.push({ type: "operator", value: char as BinaryOperator });
      index += 1;
      continue;
    }

    throw new Error(`Unexpected token "${char}"`);
  }

  return tokens;
}

class FormulaParser {
  private index = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse() {
    const expression = this.parseExpression();

    if (this.peek() !== undefined) {
      throw new Error("Unexpected formula input");
    }

    return expression;
  }

  private parseExpression(minPrecedence = 0): FormulaNode {
    let left = this.parsePrimary();

    while (true) {
      const token = this.peek();

      if (token?.type !== "operator") {
        break;
      }

      const operator = token.value as BinaryOperator;
      const precedence = binaryPrecedence[operator];

      if (precedence < minPrecedence) {
        break;
      }

      this.index += 1;
      const nextMinPrecedence = operator === "^" ? precedence : precedence + 1;
      const right = this.parseExpression(nextMinPrecedence);
      left = { type: "binary", operator, left, right };
    }

    return left;
  }

  private parsePrimary(): FormulaNode {
    const token = this.consume();

    if (token === undefined) {
      throw new Error("Expected formula value");
    }

    if (token.type === "number") {
      return { type: "number", value: token.value };
    }

    if (token.type === "operator" && (token.value === "+" || token.value === "-")) {
      return { type: "unary", operator: token.value, value: this.parsePrimary() };
    }

    if (token.type === "identifier") {
      if (this.peek()?.type !== "leftParen") {
        return { type: "variable", name: token.value };
      }

      this.index += 1;

      if (!(token.value in formulaFunctions)) {
        throw new Error(`Unknown function "${token.value}"`);
      }

      const args: FormulaNode[] = [];

      if (this.peek()?.type !== "rightParen") {
        do {
          args.push(this.parseExpression());
        } while (this.consumeComma());
      }

      this.expect("rightParen");
      return { type: "call", name: token.value as FormulaFunctionName, args };
    }

    if (token.type === "leftParen") {
      const expression = this.parseExpression();
      this.expect("rightParen");
      return expression;
    }

    throw new Error("Expected formula value");
  }

  private consumeComma() {
    if (this.peek()?.type !== "comma") {
      return false;
    }

    this.index += 1;
    return true;
  }

  private expect(type: Token["type"]) {
    if (this.consume()?.type !== type) {
      throw new Error("Invalid formula syntax");
    }
  }

  private consume() {
    const token = this.peek();
    this.index += 1;
    return token;
  }

  private peek() {
    return this.tokens[this.index];
  }
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return Number.NaN;
}

function evaluateFormulaNode(node: FormulaNode, values: Record<string, unknown>): number {
  if (node.type === "number") {
    return node.value;
  }

  if (node.type === "variable") {
    return toNumber(values[node.name]);
  }

  if (node.type === "unary") {
    const value = evaluateFormulaNode(node.value, values);
    return node.operator === "-" ? -value : value;
  }

  if (node.type === "call") {
    const args = node.args.map((arg) => evaluateFormulaNode(arg, values));
    return formulaFunctionMap[node.name](...args);
  }

  const left = evaluateFormulaNode(node.left, values);
  const right = evaluateFormulaNode(node.right, values);

  if (node.operator === "+") {
    return left + right;
  }

  if (node.operator === "-") {
    return left - right;
  }

  if (node.operator === "*") {
    return left * right;
  }

  if (node.operator === "/") {
    return left / right;
  }

  if (node.operator === "%") {
    return left % right;
  }

  return left ** right;
}

export function createFormulaEvaluator(formula: string) {
  const ast = new FormulaParser(tokenizeFormula(formula)).parse();

  return (values: Record<string, unknown>) => {
    const value = evaluateFormulaNode(ast, values);
    return Number.isFinite(value) ? value : undefined;
  };
}
