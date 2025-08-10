import { CombinatorExpression, Application, Variable } from "./combinators";

interface Level {
  goal: string;
  f1: (e: CombinatorExpression) => CombinatorExpression;
  f2: (e: CombinatorExpression) => CombinatorExpression;
}

export const levels: Level[] = [
  {
    goal: 'Given combinators M and B, and a variable a, construct an expression θ such that aθ = θ',
    f1: e => e,
    f2: e => new Application(new Variable('a'), e),
  },
  {
    goal: 'Given combinators M and B, construct an expression θ such that θθ = θ',
    f1: e => e,
    f2: e => new Application(e, e),
  },
]