interface Level {
  title: string;
  goal: string;
  source: string;
  target: string;
  allowedCombinators: string;
}

export const levels: Level[] = [
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