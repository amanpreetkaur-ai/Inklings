
export type Story = {
  slug: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  content: string[];
};

export const stories: Story[] = [
  {
    slug: "the-last-library",
    title: "The Last Library",
    author: "Mira Ellis",
    genre: "Fantasy",
    description:
      "In a city where books are disappearing, one reader discovers a library no one remembers.",
    content: [
      "The rain had not stopped for seven days when Elara found the door.",
      "It stood between a bakery and an abandoned clock shop, narrow and dark, with a brass handle shaped like a tiny bird. There was no sign above it. Only a sentence carved into the wood: Every lost story waits for someone.",
      "Elara pressed the handle. Somewhere behind the door, a thousand pages turned at once.",
      "Inside, shelves stretched farther than the eye could see. Books whispered from their places, and at the centre of the room sat a librarian who seemed to have been waiting for her for years.",
      "\"You're late,\" the librarian said. \"The last story is almost gone.\"",
    ],
  },
  {
    slug: "coffee-and-coincidences",
    title: "Coffee and Coincidences",
    author: "Ava Morgan",
    genre: "Romance",
    description:
      "Two strangers keep ordering the same coffee, until coincidence starts to feel like fate.",
    content: [
      "On Monday, she took the last window seat. On Tuesday, he arrived three seconds before her. By Friday, the barista had started making two coffees without asking.",
      "\"You know,\" he said, setting a cup beside her notebook, \"we might be following a pattern.\"",
      "\"Or you just have terrible timing,\" she replied, trying not to smile.",
      "He pulled out the chair opposite her. \"Then let me try having better timing. Can I sit here?\"",
    ],
  },
  {
    slug: "the-blue-door",
    title: "The Blue Door",
    author: "Noah Reed",
    genre: "Mystery",
    description:
      "A strange blue door appears in a house that has been locked for twenty years.",
    content: [
      "Everyone in Willow Lane knew the old house was empty. No lights, no footsteps, no visitors. So when a bright blue door appeared on its eastern wall, the whole street noticed.",
      "By sunrise, three neighbours had called the police. By noon, the door had vanished from every photograph.",
      "Only Sam's picture remained unchanged. In it, the door stood open, and someone on the other side was holding a note with Sam's name on it.",
    ],
  },
  {
    slug: "letters-to-tomorrow",
    title: "Letters to Tomorrow",
    author: "Iris Bennett",
    genre: "Drama",
    description:
      "A young woman finds letters she wrote to her future self and forgotten dreams inside them.",
    content: [
      "The box was labelled OPEN WHEN YOU FORGET.",
      "Inside were twelve envelopes, each dated exactly one year apart. The handwriting was hers, though she could barely remember the person who had written them.",
      "The first letter began: If you're reading this, I hope you still make time for the things that make you feel alive.",
      "She sat on the floor until evening, reading every word, remembering a little more with each page.",
    ],
  },
];
