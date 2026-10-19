export type FounderStory = {
  id: string;
  videoId: string;
  startSeconds: number;
  founderName: string;
  companyName: string;
  tagline: string;
  cardFacts?: readonly { label: string; text: string }[];
  description: string;
  website: string;
  campaignUrl?: string;
};

export const founderStories: readonly FounderStory[] = [
  {
    id: "edulis-therapeutics",
    videoId: "fWlgscGBECY",
    startSeconds: 37,
    founderName: "Brady Souma",
    companyName: "Lazarus Eagles",
    tagline: "Compression Socks Made Easy to Wear",
    cardFacts: [
      { label: "Traction", text: "Clinically validated compression pressure; featured as a startup to watch." },
      { label: "Team & Funding", text: "$15K raised; backed by Georgia Tech CREATE-X with expertise from Apple and Emory." },
    ],
    description: "Edulis is building the first gut implants for sustained, localized treatment of chronic GI diseases like IBD and colorectal cancer.",
    website: "https://www.edulis.xyz/",
  },
  {
    id: "seeair",
    videoId: "G7RApMoWZEc",
    startSeconds: 5,
    founderName: "Nathan Poon",
    companyName: "Avol",
    tagline: "Medical Deliveries, 11x Faster",
    cardFacts: [
      { label: "Traction", text: "31% MoM growth, $27K monthly revenue, $3M waitlist." },
      { label: "Team & Funding", text: "$3.8M raised; backed by Draper Associates and led by Tesla/Amazon veterans." },
    ],
    description: "SeeAir automates energy efficiency programs",
    website: "https://seeair.com/",
  },
  {
    id: "standard-h2",
    videoId: "I-IvprnuL7Q",
    startSeconds: 2,
    founderName: "Josh Garton",
    companyName: "Prairie Biosciences",
    tagline: "Research-Ready Answers, No Code Required",
    cardFacts: [
      { label: "Traction", text: "$20K revenue, 9 paid projects, 5 academic partnerships." },
      { label: "Team & Funding", text: "15+ years of scientific expertise; bootstrapped with a live platform and provisional patent." },
    ],
    description: "Research & Product development for solutions to global pollution problems",
    website: "https://standardh2.com/",
  },
  {
    id: "decentral-ai",
    videoId: "cyYExaj6EHA",
    startSeconds: 2,
    founderName: "Carmelo R. Montalvo",
    companyName: "Aethl Bio",
    tagline: "Advanced Dressings for Chronic Wounds",
    cardFacts: [
      { label: "Traction", text: "$1.2M/quarter potential pilot revenue post-clearance; major distribution talks underway." },
      { label: "Team & Funding", text: "$2.6M raised; experienced medtech founders with a prior exit." },
    ],
    description: "Enterprise AI orchestration for regulated industries: companies run any AI model on their own infrastructure, with governance built in, so sensitive data never leaves their walls.",
    website: "https://dctrl.ai/",
  },

];

export function youtubeUrl(story: FounderStory) {
  return `https://www.youtube.com/watch?v=${story.videoId}&t=${story.startSeconds}s`;
}
