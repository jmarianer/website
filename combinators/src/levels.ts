import { CombinatorExpression, Application, Variable } from "./combinators";

interface Level {
  title: string;
  goal: string;
  f1: (e: CombinatorExpression) => CombinatorExpression;
  f2: (e: CombinatorExpression) => CombinatorExpression;
  allowedCombinators: string;
}

export const levels: Level[] = [
  {
    title: 'Level 1',
    goal: 'Construct an expression θ such that aθ = θ',
    f1: e => e,
    f2: e => new Application(new Variable('a'), e),
    allowedCombinators: 'MB',
  },
  {
    title: 'Level 2',
    goal: 'Construct an expression θ such that θθ = θ',
    f1: e => e,
    f2: e => new Application(e, e),
    allowedCombinators: 'MB',
  },
]