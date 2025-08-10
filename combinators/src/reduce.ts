import { CombinatorExpression, Application, Combinator, parseExpression, Variable } from "./combinators";

interface BasicCombinator {
  argCount: number;
  template: string;
  name: string;
}

export const allBasicCombinators: Record<string, BasicCombinator> = {
  S: { argCount: 3, template: 'ac(bc)', name: 'S' },
  K: { argCount: 2, template: 'a', name: 'K' },
  I: { argCount: 1, template: 'a', name: 'I' },
  M: { argCount: 1, template: 'aa', name: 'M' },
  B: { argCount: 3, template: 'a(bc)', name: 'B' },
  C: { argCount: 3, template: 'acb', name: 'C' },
  W: { argCount: 2, template: 'abb', name: 'W' },
};

export function reduceOnce(e: CombinatorExpression, basicCombinators: Record<string, BasicCombinator>): CombinatorExpression | false {
  if (!(e instanceof Application)) {
    return false;
  }

  const [func, ...args] = getArgs(e);
  if (func instanceof Combinator && func.value in basicCombinators) {
    const {argCount, template} = basicCombinators[func.value];
    if (args.length === argCount) {
      const s = parseExpression(template);
      return substitute(s, args);
    }
  }

  const reduceLeft = reduceOnce(e.left, basicCombinators);
  if (reduceLeft) {
    return new Application(reduceLeft, e.right);
  }

  const reduceRight = reduceOnce(e.right, basicCombinators);
  if (reduceRight) {
    return new Application(e.left, reduceRight);
  }

  return false;
}

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

const MAX_REDUCTIONS = 10;

export function reduce(expr: CombinatorExpression, basicCombinators: Record<string, BasicCombinator>): CombinatorExpression[] {
  let ret: CombinatorExpression[] = [];
  while (expr && ret.length < MAX_REDUCTIONS) {
    ret.push(expr);
    expr = reduceOnce(expr, basicCombinators);
  }
  return ret;
}