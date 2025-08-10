import { useState } from 'react'
import { CombinatorExpression, parseExpression } from './combinators';
import { allBasicCombinators, reduceOnce } from "./reduce";

function App() {
  const [exprString, setExprString] = useState('Kxy');

  let expr: CombinatorExpression | null;
  try {
    expr = parseExpression(exprString);
  }
  catch (e) {
    expr = null;
  }

  let reductions: string[] = [];
  if (expr) {
    let reducedExpr = expr;
    while (reducedExpr && reductions.length < 50) {
      reductions.push(reducedExpr.toString(false));
      reducedExpr = reduceOnce(reducedExpr, allBasicCombinators);
    }
  }

  return (
    <>
      <label>
        Enter an expression:
        <input value={exprString} onChange={e => setExprString(e.target.value)} />
      </label>
      {expr && <>
        Original expression: {exprString}<br />
        All parens: {expr.toString()}<br />
        No parens: {expr.toString(false)}<br />
        Reduce once: {reduceOnce(expr, allBasicCombinators).toString(false)}<br />
        All reductions: {reductions.map(r => <>{r}<br/></>)}
      </>}
    </>
  );
}

export default App
