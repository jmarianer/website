import { useState } from 'react'
import { Application, CombinatorExpression, parseExpression, Variable } from './combinators';
import { allBasicCombinators, reduce } from "./reduce";
import { levels } from './levels';
import { useParams } from 'react-router';

function ShowReductions({ r }: { r: CombinatorExpression[] }) {
  return <>
    <ul>
      {r.map(r => <li>{r.toString(false)}</li>)}
    </ul></>;
}

function tryIt(expr1: CombinatorExpression, expr2: CombinatorExpression) {
  try {
    const reductions1 = reduce(expr1, allBasicCombinators);
    const reductions2 = reduce(expr2, allBasicCombinators);

    const set1 = new Set(reductions1.map(e => e.toString()));
    const set2 = new Set(reductions2.map(e => e.toString()));
    const win = set1.intersection(set2).size > 0;

    if (win) {
      reductions1.length = reductions1.findIndex(e => set2.has(e.toString())) + 1;
      const common = reductions1[reductions1.length-1].toString();
      reductions2.length = reductions2.findIndex(e => e.toString() === common) + 1;

      return <>
        Yay, win!
        <ShowReductions r={reductions1} />
        <ShowReductions r={reductions2} />
      </>;
    }

    return <>
      Nope!
      <ShowReductions r={reductions1} />
      <ShowReductions r={reductions2} />
    </>;
  }
  catch (e) {
    return <pre>{`${e}`}</pre>;
  }
}

export function Level() {
  const {id} = useParams();
  const {goal, f1, f2} = levels[parseInt(id!, 10) - 1];

  const [exprString, setExprString] = useState('');
  let [results, setResults] = useState(<></>);

  return (
    <>
      <label>
        {goal}<br />
        <input value={exprString} onChange={e => setExprString(e.target.value)} />
      </label>
      <button onClick={() => {
        const inputExpr = parseExpression(exprString);
        setResults(tryIt(f1(inputExpr), f2(inputExpr)));
      }}>Try it!</button>
      {results}
    </>
  );
}
