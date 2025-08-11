interface Level {
  title: string;
  description: string;
  source: string;
  target: string;
  allowedCombinators: string;
}

export const levels: Level[] = [
  {
    title: 'A very basic introduction',
    description: 'In combinatory logic, functions are single capital letters and variables are lowercase. Function application is written (fx), rather than f(x). Let\'s start with the identity function I, which always returns its argument. When applied to the variable a, we\'ll get a right back out. Enter (Ia) in the box and see how it returns a',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'I',
  },
  {
    title: 'Omitting parentheses',
    description: 'Parentheses are optional when unambiguous. Enter Ia (without parens) in the box',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'I',
  },
  {
    title: 'Multiple arguments',
    description: 'Our next combinator takes two arguments. K applied to two arguments always returns its first argument. Write an expression using K that returns a',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'K',
  },
  {
    title: 'Currying',
    description: 'Actually, all functions take just one argument. Kab is actually K applied to a, then the result applied to b. Enter ((Ka)b) in the box below and see what happens',
    source: 'θ',
    target: 'a',
    allowedCombinators: 'K',
  },
  {
    title: 'Identity',
    description: 'Our last basic combinator is the S combinator, which takes three arguments, all curried, and applies the first two to the third: Sxyz = xz(yz). Using the S and K combinator, we can create an identity combinator, such that θa = a for all a',
    source: 'θa',
    target: 'a',
    allowedCombinators: 'SK',
  },
  {
    title: 'Self-application',
    description: 'Construct a self-application combinator, such that θa = aa for all a. Note that the identity combinator is now available, under the name I',
    source: 'θa',
    target: 'aa',
    allowedCombinators: 'SKI',
  },
  {
    title: 'Composition',
    description: 'Another basic operation is function composition. The composition operator is an operator such that θab composes a and b; in other words, θabx=a(bx) for all x',
    source: 'θabx',
    target: 'a(bx)',
    allowedCombinators: 'SKIU',
  },
  {
    title: 'Fixed point',
    description: 'Construct a fixed point for an arbitrary combinator a, that is an expression θ such that aθ = θ',
    source: 'aθ',
    target: 'θ',
    allowedCombinators: 'UB',
  },
  {
    title: 'A function that is its own fixed point',
    description: 'Construct an expression θ such that θθ = θ',
    source: 'θθ',
    target: 'θ',
    allowedCombinators: 'UB',
  },
  {
    title: 'A deep void',
    description: 'Construct an expression θ such that θa = θ for all a. This is known as a void expression, since it "eats" anything you put in',
    source: 'θa',
    target: 'θ',
    allowedCombinators: 'UBK',
  },
  {
    title: 'A little flippant',
    description: 'Construct the C combinator, such that Cfgx = fxg',
    source: 'θfgx',
    target: 'fxg',
    allowedCombinators: 'SKIUB',
  },
]