export abstract class CombinatorExpression {
  abstract toString(parens?: boolean): string;
}

export class Variable extends CombinatorExpression {
  constructor(public readonly value: string) { super(); }
  toString() { return this.value; }
}

export class Combinator extends CombinatorExpression {
  constructor(public readonly value: string) { super(); }
  toString() { return this.value; }
}

export class Application extends CombinatorExpression {
  constructor(public readonly left: CombinatorExpression, public readonly right: CombinatorExpression) { super(); }

  toString(parens: boolean = true): string {
    if (parens) {
      return `(${this.left.toString()}${this.right.toString()})`
    }

    const rightStr = this.right instanceof Application
      ? `(${this.right.toString(false)})`
      : this.right.toString(false);
    return `${this.left.toString(false)}${rightStr}`;
  }
}

export function parseExpression(input: string): CombinatorExpression {
  input = input.replace(/\s+/g, '');
  let pos = 0;

  let out = parseAtom();
  while (pos < input.length) {
    out = new Application(out, parseAtom());
  }
  return out;

  function parseAtom(): CombinatorExpression {
    const char = input[pos++];

    if (char === '(') {
      let out = parseAtom();
      while (input[pos] != ')') {
        out = new Application(out, parseAtom());
      }
      pos++;
      return out;
    } else if (char.match(/[A-Z]/)) {
      return new Combinator(char);
    } else if (char.match(/[a-z]/)) {
      return new Variable(char);
    } else {
      throw new Error(`Unexpected character: ${char}`);
    }
  }
}

