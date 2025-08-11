import { useState } from 'react'
import { CombinatorExpression, parseExpression } from './combinators';
import { allBasicCombinators, reduce, substitute, type BasicCombinator } from "./reduce";
import { levels } from './levels';
import { Link, useParams } from 'react-router';
import { pick, reverse } from 'lodash';
import { showAllowedCombinators, ShowReductions } from './utils';

function tryIt(inputExpr: CombinatorExpression, source: string, target: string, basicCombinators: Record<string, BasicCombinator>) {
  function munge(expr: string): CombinatorExpression[] {
    const newExpr = parseExpression(expr);
    return reduce(substitute(newExpr, {'θ': inputExpr}), basicCombinators);
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

      const reductions = [...sourceReductions, ...reverse(targetReductions), target];

      return <div className='win'>
        <span>Success!</span>
        <ShowReductions start={source} r={reductions} />
      </div>
    }

    return <div className='lose'>
      <ShowReductions start={source} r={sourceReductions} />
      <ShowReductions start={target} r={targetReductions} />
    </div>;
  }
  catch (e) {
    return <pre>{`${e}`}</pre>;
  }
}

export function Level() {
  const {id: stringId} = useParams();
  const id = parseInt(stringId!, 10);
  const {description, source, target, title, allowedCombinators: allowedCombinatorNames } = levels[id - 1];
  const allowedCombinators = pick(allBasicCombinators, allowedCombinatorNames.split(''));

  const [exprString, setExprString] = useState('');
  let [results, setResults] = useState(<></>);

  return (
    <>
      <div className="nextPrev">
        <Link to={`/level/${id - 1}`} style={id > 1 ? {} : {visibility: 'hidden'}}>
          Previous level
        </Link>
        <div className='spacer' />
        <Link to="/">Home</Link>
        <div className='spacer' />
        <Link to={`/level/${id + 1}`} style={id < levels.length ? {} : {visibility: 'hidden'}}>
          Next level
        </Link>
      </div>
      <h1>{title}</h1>
      <div className='levelDescription'>{description}</div>
      <span className='mainInput'>
        <form onSubmit={e => {
          e.preventDefault();
          const inputExpr = parseExpression(exprString);
          setResults(tryIt(inputExpr, source, target, allowedCombinators));
        }}>
          <span>θ =&nbsp;</span>
          <input
            value={exprString}
            onChange={e => setExprString(e.target.value)}
          />
          <button type="submit">
            Try it!
          </button>
        </form>
      </span>
      <div className='goal'>Goal: <span>{source}={target}</span></div>
      {results}
      <div className='spacer' />
      {showAllowedCombinators(allowedCombinators)}
    </>
  );
}
