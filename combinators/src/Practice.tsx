import { useState } from 'react'
import { parseExpression } from './combinators';
import { allBasicCombinators, reduce } from "./reduce";
import { showAllowedCombinators, ShowReductions } from './utils';
import { Link } from 'react-router';

function Practice() {
  const [exprString, setExprString] = useState('');
  let [results, setResults] = useState(<></>);

  return (
    <>
      <div className="nextPrev">
        <div className='spacer' />
        <Link to="/">Home</Link>
        <div className='spacer' />
      </div>
      <h1>Practice</h1>
      <div className='goal'>Enter any expression here to see how it reduces</div>
      <span className='mainInput'>
        <form onSubmit={e => {
          e.preventDefault();
          const inputExpr = parseExpression(exprString);
          const reductions = reduce(inputExpr, allBasicCombinators).slice(1);
          setResults(<div className='win'><ShowReductions start={inputExpr} r={reductions} /></div>);
        }}>
          <input
            value={exprString}
            onChange={e => setExprString(e.target.value)}
          />
          <button type="submit">
            Try it!
          </button>
        </form>
      </span>
      {results}
      <div className='spacer' />
      {showAllowedCombinators(allBasicCombinators)}
    </>
  );
}

export default Practice
