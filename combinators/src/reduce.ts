import { CombinatorExpression, Application, Combinator, parseExpression, Variable } from "./combinators";

export interface BasicCombinator {
  argNames: string
  template: string;
  name: string;
}

export const allBasicCombinators: Record<string, BasicCombinator> = {
  S: { argNames: 'xyz', template: 'xz(yz)', name: 'S' },
  K: { argNames: 'xy', template: 'x', name: 'K' },
  I: { argNames: 'x', template: 'x', name: 'I' },
  M: { argNames: 'x', template: 'xx', name: 'M' },
  B: { argNames: 'xyz', template: 'x(yz)', name: 'B' },
  C: { argNames: 'xyz', template: 'xzy', name: 'C' },
  W: { argNames: 'xy', template: 'xyy', name: 'W' },
};

function reduceOnce(e: CombinatorExpression, basicCombinators: Record<string, BasicCombinator>): CombinatorExpression | false {
  if (!(e instanceof Application)) {
    return false;
  }

  const [func, ...args] = getArgs(e);
  if (func instanceof Combinator && func.value in basicCombinators) {
    const {argNames, template} = basicCombinators[func.value];
    if (args.length === argNames.length) {
      const s = parseExpression(template);
      const substitutions: Record<string, CombinatorExpression> = {};
      for (let i = 0; i < argNames.length; ++i) {
        substitutions[argNames[i]] = args[i];
      }
      return substitute(s, substitutions);
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

function substitute(expr: CombinatorExpression, substitutions: Record<string, CombinatorExpression>): CombinatorExpression {
  if (expr instanceof Variable) {
    return substitutions[expr.value];
  }
  if (expr instanceof Application) {
    return new Application(substitute(expr.left, substitutions), substitute(expr.right, substitutions));
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