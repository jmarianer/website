import type { CombinatorExpression } from './combinators';
import type { BasicCombinator } from './reduce';

export function showAllowedCombinators(allowedCombinators: Record<string, BasicCombinator>) {
  return <div className='allowed'>
    <h1>Allowed combinators</h1>
    {Object.values(allowedCombinators).map(({ name, argNames, template }) => <span>{name}{argNames} ⇒ {template}</span>)}
  </div>;
}

export function ShowReductions({ start, r }: { start: CombinatorExpression, r: CombinatorExpression[]; }) {
  return <table className='reductions'>
    <tbody>
      {r.map((e, i) => (
        <tr key={i}>
          <td>{i === 0 && start.toString(false)}</td>
          <td>=</td>
          <td>{e.toString(false)}</td>
        </tr>
      ))}
    </tbody>
  </table>;
}

