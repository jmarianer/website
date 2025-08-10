import type { CombinatorExpression } from './combinators';
import type { BasicCombinator } from './reduce';

export function showAllowedCombinators(allowedCombinators: Record<string, BasicCombinator>) {
  return <div className='allowed'>
    <h1>Allowed combinators</h1>
    {Object.values(allowedCombinators).map(({ name, argNames, template }) => <span>{name}{argNames} ⇒ {template}</span>)}
  </div>;
}

export function ShowReductions({ r }: { r: CombinatorExpression[]; }) {
  if (!r.length) {
    return <></>;
  }
  let i = 0;
  let ret = [<div key={i++}>{r[0].toString(false)}</div>];
  for (const e of r.slice(1)) {
    ret.push(<div key={i++}>⇓</div>);
    ret.push(<div key={i++}>{e.toString(false)}</div>);
  }

  return <div>{ret}</div>;
}

