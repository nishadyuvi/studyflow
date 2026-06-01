export const MOTIVATIONAL_QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' },
  { text: 'Don’t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'You don’t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Study while others are sleeping; work while others are loafing.', author: 'William Arthur Ward' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
]

export function randomQuote() {
  return MOTIVATIONAL_QUOTES[
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  ]
}
