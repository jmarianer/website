export abstract class CombinatorExpression {
  abstract toString(parens?: boolean): string;
}

export class Variable extends CombinatorExpression {
  constructor(public readonly value: string) { super(); }
  toString() { return this.value; }
}

export class BasicCombinator extends CombinatorExpression {
  constructor(public readonly value: string) { super(); }
  toString() { return this.value; }
}

export class Application extends CombinatorExpression {
  constructor(public readonly left: CombinatorExpression, public readonly right: CombinatorExpression) { super(); }

  toString(parens: boolean = true): string {
    if (parens) {
      return `(${this.left.toString()}${this.right.toString()})`
    }

    const rightStr = this.right instanceof Application
      ? `(${this.right.toString(false)})`
      : this.right.toString(false);
    return `${this.left.toString(false)}${rightStr}`;
  }
}

export function parseExpression(input: string): CombinatorExpression {
  input = input.replace(/\s+/g, '');
  let pos = 0;

  let out = parseAtom();
  while (pos < input.length) {
    out = new Application(out, parseAtom());
  }
  return out;

  function parseAtom(): CombinatorExpression {
    const char = input[pos++];

    if (char === '(') {
      let out = parseAtom();
      while (input[pos] != ')') {
        out = new Application(out, parseAtom());
      }
      pos++;
      return out;
    } else if (char.match(/[A-Z]/)) {
      return new BasicCombinator(char);
    } else if (char.match(/[a-z]/)) {
      return new Variable(char);
    } else {
      throw new Error(`Unexpected character: ${char}`);
    }
  }
}

export const defaultCombinators: Record<string, [number, string]> = {
  S: [3, 'ac(bc)'],
  K: [2, 'a'],
  I: [1, 'a'],
  M: [1, 'aa'],
  B: [3, 'a(bc)'],
  C: [3, 'acb'],
  W: [2, 'abb'],
}

export function reduceOnce(e: CombinatorExpression, reductions: typeof defaultCombinators): CombinatorExpression | false {
  if (!(e instanceof Application)) {
      return false;
  }

  const [func, ...args] = getArgs(e);
  if (func instanceof BasicCombinator && func.value in reductions) {
    const [argCount, sub] = reductions[func.value];
    if (args.length === argCount) {
      const s = parseExpression(sub);
      return substitute(s, args);
    }
  }

  const reduceLeft = reduceOnce(e.left, reductions);
  if (reduceLeft) {
    return new Application(reduceLeft, e.right);
  }

  const reduceRight = reduceOnce(e.right, reductions);
  if (reduceRight) {
    return new Application(e.left, reduceRight);
  }

  return false;

  function getArgs(e: CombinatorExpression): CombinatorExpression[] {
    let args: CombinatorExpression[] = [];
    while (e instanceof Application) {
      args.unshift(e.right);
      e = e.left;
    }
    args.unshift(e);
    return args;
  }

  function substitute(expr: CombinatorExpression, values: CombinatorExpression[]): CombinatorExpression {
    if (expr instanceof Variable) {
      const varIndex = expr.value.charCodeAt(0) - 'a'.charCodeAt(0);
      return values[varIndex];
    }
    if (expr instanceof Application) {
      return new Application(substitute(expr.left, values), substitute(expr.right, values));
    }
    return expr;
  }
}