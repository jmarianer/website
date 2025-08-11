import { useState } from 'react'
import { parseExpression } from './combinators';
import { allBasicCombinators, reduce } from "./reduce";
import { showAllowedCombinators, ShowReductions } from './utils';

function Practice() {
  const [exprString, setExprString] = useState('');
  let [results, setResults] = useState(<></>);

  return (
    <>
      <h1>Practice</h1>
      <div className='goal'>Enter any expression here to see how it reduces</div>
      <span className='mainInput'>
        <input value={exprString} onChange={e => setExprString(e.target.value)} />
        <button onClick={() => {
          const inputExpr = parseExpression(exprString);
          const reductions = reduce(inputExpr, allBasicCombinators).slice(1);
          setResults(<div className='win'><ShowReductions start={inputExpr} r={reductions} /></div>);
        }}>Try it!</button>
      </span>
      {results}
      <div className='spacer' />
      {showAllowedCombinators(allBasicCombinators)}
    </>
  );
}

export default Practice
