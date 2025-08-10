import { useState } from 'react'
import { Application, CombinatorExpression, defaultCombinators, parseExpression, reduceOnce } from './combinators';

export function Level2() {
  const [exprString, setExprString] = useState('Kxy');

  let [results, setResults] = useState(<></>);

  function tryIt() {
    try {
      let expr = parseExpression(exprString);
      const desired = new Application(expr, expr).toString();

      let reductions: CombinatorExpression[] = [];
      while (expr && reductions.length < 5) {
        reductions.push(expr);
        if (expr.toString() === desired) {
          setResults(<>
            Yay, win!
          </>);
          return;
        }
        expr = reduceOnce(expr, defaultCombinators);
      }

      setResults(<>
        Nope! Here's what happened to your expression:
        <ul>
          {reductions.map(r => <li>{r.toString(false)}</li>)}
        </ul>
      </>);
    }
    catch (e) {
      setResults(<pre>{`${e}`}</pre>);
    }
  }

  return (
    <>
      <label>
        Given combinators M and B, construct an expression θ such that θθ = θ<br />
        <input value={exprString} onChange={e => setExprString(e.target.value)} />
      </label>
      <button onClick={tryIt}>Try it!</button>
      {results}
    </>
  );
}
