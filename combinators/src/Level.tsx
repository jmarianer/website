import { useState } from 'react'
import { CombinatorExpression, parseExpression } from './combinators';
import { allBasicCombinators, reduce, type BasicCombinator } from "./reduce";
import { levels } from './levels';
import { useParams } from 'react-router';
import { pick, reverse } from 'lodash';
import { showAllowedCombinators, ShowReductions } from './utils';

function tryIt(expr1: CombinatorExpression, expr2: CombinatorExpression, basicCombinators: Record<string, BasicCombinator>) {
  try {
    const reductions1 = reduce(expr1, basicCombinators);
    const reductions2 = reduce(expr2, basicCombinators);

    const set1 = new Set(reductions1.map(e => e.toString()));
    const set2 = new Set(reductions2.map(e => e.toString()));
    const win = set1.intersection(set2).size > 0;

    if (win) {
      reductions1.length = reductions1.findIndex(e => set2.has(e.toString())) + 1;
      const common = reductions1[reductions1.length-1].toString();
      reductions2.length = reductions2.findIndex(e => e.toString() === common);

      const reductions = [...reductions1, ...reverse(reductions2)];

      return <div className='win'>
        <ShowReductions r={reductions} />
      </div>
    }

    return <div className='lose'>
      <ShowReductions r={reductions1} />
      <ShowReductions r={reductions2} />
    </div>;
  }
  catch (e) {
    return <pre>{`${e}`}</pre>;
  }
}

export function Level() {
  const {id} = useParams();
  const {goal, f1, f2, title, allowedCombinators: allowedCombinatorNames } = levels[parseInt(id!, 10) - 1];
  const allowedCombinators = pick(allBasicCombinators, allowedCombinatorNames.split(''));

  const [exprString, setExprString] = useState('');
  let [results, setResults] = useState(<></>);

  return (
    <>
      <h1>{title}</h1>
      <div className='goal'>{goal}</div>
      <span className='mainInput'>
        <input value={exprString} onChange={e => setExprString(e.target.value)} />
        <button onClick={() => {
          const inputExpr = parseExpression(exprString);
          setResults(tryIt(f1(inputExpr), f2(inputExpr), allowedCombinators));
        }}>Try it!</button>
      </span>
      {results}
      <div className='spacer' />
      {showAllowedCombinators(allowedCombinators)}
    </>
  );
}
