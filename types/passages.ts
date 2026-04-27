export interface Passage {
  id: string
  title: string
  source: string
  text: string
}

export const SAMPLE_PASSAGES: Passage[] = [
  {
    id: 'interstellar',
    title: 'Interstellar',
    source: 'Christopher Nolan, 2014',
    text: "We used to look up at the sky and wonder at our place in the stars. Now we just look down, and worry about our place in the dirt.",
  },
  {
    id: 'great-dictator',
    title: 'The Great Dictator',
    source: 'Charlie Chaplin, 1940',
    text: "You, the people, have the power to make this life free and beautiful, to make this life a wonderful adventure. Let us fight to free the world, to do away with national barriers, to do away with greed, with hate and intolerance. Let us fight for a world of reason, a world where science and progress will lead to all men's happiness.",
  },
  {
    id: 'rocky-balboa',
    title: 'Rocky Balboa',
    source: 'Sylvester Stallone, 2006',
    text: "Let me tell you something you already know. The world ain't all sunshine and rainbows, it's a very mean and nasty place and I don't care how tough you are it will beat you to your knees and keep you there permanently if you let it. You, me, nobody is gonna hit as hard as life! But it ain't about how hard you can hit, it's about how hard you can get hit and keep movin' forward, how much you can take...and keep movin' forward. That's how winning is done!",
  },
]
