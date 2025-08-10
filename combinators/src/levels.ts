interface Level {
  title: string;
  goal: string;
  source: string;
  target: string;
  allowedCombinators: string;
}

export const levels: Level[] = [
  {
    title: 'A very basic introduction',
    goal: 'In combinatory logic, functions are single capital letters and variables are lowercase. Function application is written (fx), rather than f(x). Let\'s start with the identity function I, which always returns its argument. When applied to the variable a, we\'ll get a right back out. Enter (Ia) in the box and see how it returns a',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'I',
  },
  {
    title: 'Omitting parentheses',
    goal: 'Parentheses are optional when unambiguous. Enter Ia (without parens) in the box',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'I',
  },
  {
    title: 'Multiple arguments',
    goal: 'Our next combinator takes two arguments. K applied to two arguments always returns its first argument. Write an expression using K that returns a',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'K',
  },
  {
    title: 'Currying',
    goal: 'Actually, all functions take just one argument. Kab is actually K applied to a, then the result applied to b. Enter ((Ka)b) in the box below and see what happens',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'K',
  },
  {
    title: 'Level 1',
    goal: 'Construct a fixed point for an arbitrary combinator a, that is an expression θ such that aθ = θ',
    source: 'aθ',
    target: 'θ',
    allowedCombinators: 'MB',
  },
  {
    title: 'Level 2',
    goal: 'Construct an expression θ such that θθ = θ',
    source: 'θθ',
    target: 'θ',
    allowedCombinators: 'MB',
  },
  {
    title: 'Level 3',
    goal: 'Construct an expression θ such that θa = θ for all a',
    source: 'θa',
    target: 'θ',
    allowedCombinators: 'MBK',
  },
]