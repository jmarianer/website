import { useState } from 'react'
import { CombinatorExpression, parseExpression } from './combinators';
import { allBasicCombinators, reduce, substitute, type BasicCombinator } from "./reduce";
import { levels } from './levels';
import { useParams } from 'react-router';
import { pick, reverse } from 'lodash';
import { showAllowedCombinators, ShowReductions } from './utils';

function tryIt(inputExpr: CombinatorExpression, source: string, target: string, basicCombinators: Record<string, BasicCombinator>) {
  function munge(expr: string): CombinatorExpression[] {
    const newExpr = parseExpression(expr);
    console.log(substitute(newExpr, {'θ': inputExpr}));
    return [newExpr, ...reduce(substitute(newExpr, {'θ': inputExpr}), basicCombinators)];
  }

  try {
    const sourceReductions = munge(source);
    const targetReductions = munge(target);

    const set1 = new Set(sourceReductions.map(e => e.toString()));
    const set2 = new Set(targetReductions.map(e => e.toString()));
    const win = set1.intersection(set2).size > 0;

    if (win) {
      sourceReductions.length = sourceReductions.findIndex(e => set2.has(e.toString())) + 1;
      const common = sourceReductions[sourceReductions.length-1].toString();
      targetReductions.length = targetReductions.findIndex(e => e.toString() === common);

      const reductions = [...sourceReductions, ...reverse(targetReductions)];

      return <div className='win'>
        <ShowReductions r={reductions} />
      </div>
    }

    return <div className='lose'>
      <ShowReductions r={sourceReductions} />
      <ShowReductions r={targetReductions} />
    </div>;
  }
  catch (e) {
    return <pre>{`${e}`}</pre>;
  }
}

export function Level() {
  const {id} = useParams();
  const {goal, source, target, title, allowedCombinators: allowedCombinatorNames } = levels[parseInt(id!, 10) - 1];
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
          setResults(tryIt(inputExpr, source, target, allowedCombinators));
        }}>Try it!</button>
      </span>
      {results}
      <div className='spacer' />
      {showAllowedCombinators(allowedCombinators)}
    </>
  );
}
