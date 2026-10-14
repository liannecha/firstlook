export type FounderStory = {
  id: string;
  videoId: string;
  startSeconds: number;
  founderName: string;
  companyName: string;
  tagline: string;
  description: string;
  website: string;
  campaignUrl?: string;
};

export const founderStories: readonly FounderStory[] = [
  {
    id: "edulis-therapeutics",
    videoId: "fWlgscGBECY",
    startSeconds: 37,
    founderName: "Spencer Matonis",
    companyName: "Edulis Therapeutics",
    tagline: "Localized Treatment for Gut Diseases",
    description: "Edulis is building the first gut implants for sustained, localized treatment of chronic GI diseases like IBD and colorectal cancer.",
    website: "https://www.edulis.xyz/",
  },
  {
    id: "seeair",
    videoId: "G7RApMoWZEc",
    startSeconds: 5,
    founderName: "Piers MacNaughton",
    companyName: "SeeAir, Inc.",
    tagline: "Automating Energy Efficiency Programs",
    description: "SeeAir automates energy efficiency programs",
    website: "https://seeair.com/",
  },
  {
    id: "standard-h2",
    videoId: "I-IvprnuL7Q",
    startSeconds: 2,
    founderName: "James Wasas",
    companyName: "Standard H2, Inc.",
    tagline: "Solutions to Global Pollution Problems",
    description: "Research & Product development for solutions to global pollution problems",
    website: "https://standardh2.com/",
  },
  {
    id: "decentral-ai",
    videoId: "cyYExaj6EHA",
    startSeconds: 2,
    founderName: "Marouen Helali",
    companyName: "Decentral AI",
    tagline: "Private AI for Regulated Industries",
    description: "Enterprise AI orchestration for regulated industries: companies run any AI model on their own infrastructure, with governance built in, so sensitive data never leaves their walls.",
    website: "https://dctrl.ai/",
  },

];

export function youtubeUrl(story: FounderStory) {
  return `https://www.youtube.com/watch?v=${story.videoId}&t=${story.startSeconds}s`;
}
