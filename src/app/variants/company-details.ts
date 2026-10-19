type DetailBullet = { label?: string; text: string };
type FundingField = { label: string; value: string };
type CompanyDetails = {
  overview: string;
  productSolution: string;
  tractionMilestones: readonly string[];
  teamExpertise: readonly DetailBullet[];
  funding: readonly FundingField[];
};

export type CompanyDetailSection =
  | { title: string; kind: "paragraph"; text: string }
  | { title: string; kind: "bullets"; items: readonly DetailBullet[] }
  | { title: string; kind: "funding"; fields: readonly FundingField[] };

// Supplied company content, mapped to stable IDs without renaming existing cards.
const detailsByCompanyId: Readonly<Record<string, CompanyDetails>> = {
  "seeair": {
    "overview": "Avol uses autonomous electric aircraft to deliver medical supplies up to 11x faster and at a lower cost than traditional ground transportation.",
    "productSolution": "Autonomous electric aircraft designed for medical logistics, enabling healthcare providers to transport supplies quickly and efficiently without relying on ground couriers.",
    "tractionMilestones": [
      "Operating across 8+ states.",
      "Built over 33 aircraft and completed more than 3,200 flight miles.",
      "Established partnerships with NORA and Trinity, two leading U.S. medical courier companies.",
      "Successfully handling 1–4 deliveries per day."
    ],
    "teamExpertise": [
      {
        "label": "CEO Nate Poon",
        "text": "UC Berkeley PhD with 10 years of robotics and AI experience at Amazon, Tesla, DHL, and Kaiser. Two-time founder with one exit."
      },
      {
        "label": "CTO Diar",
        "text": "Inventor of NeSLAM, a computer vision approach to spatial mapping."
      },
      {
        "label": "VP Manufacturing Drake",
        "text": "Previously led military drone manufacturing at AeroVironment."
      },
      {
        "label": "VP Systems Nikita",
        "text": "Rebuilt PX4 flight-control software to support Avol's fully autonomous aircraft."
      }
    ],
    "funding": [
      {
        "label": "Previously Raised",
        "value": "$3.8M"
      },
      {
        "label": "Current Instrument",
        "value": "SAFE"
      },
      {
        "label": "Valuation Cap",
        "value": "$25M"
      },
      {
        "label": "Raised on Current Terms",
        "value": "$385K"
      }
    ]
  },
  "standard-h2": {
    "overview": "A no-code scientific analysis platform that transforms research data into publication-ready, reproducible results, eliminating the need for researchers to write code.",
    "productSolution": "Researchers upload their datasets and receive reproducible, publication-ready analyses without programming expertise.",
    "tractionMilestones": [
      "Completed 9 paying research projects.",
      "Established academic partnerships with OU, OUHSC, OMRF, FSU, and UMMC.",
      "Secured a biotech partnership with Cadenza.",
      "Obtained an LOI and statement of work with Syntheia Labs.",
      "First-author manuscript under revision with OU HSC.",
      "Launched a live platform and filed one provisional patent."
    ],
    "teamExpertise": [
      {
        "label": "Josh, Co-Founder",
        "text": "Experience across government and industry laboratories, with strong connections to Oklahoma's research community."
      },
      {
        "label": "Reegan Miller, MS, PhD, Co-Founder",
        "text": "Specializes in single-cell and spatial biology."
      },
      {
        "text": "Combined 15+ years of scientific experience spanning laboratory research and computational analysis."
      }
    ],
    "funding": [
      {
        "label": "Non-dilutive Scholarship",
        "value": "$2K"
      },
      {
        "label": "Current Instrument",
        "value": "SAFE"
      },
      {
        "label": "Valuation Cap",
        "value": "$5M"
      },
      {
        "label": "Fundraising Target",
        "value": "$100K"
      },
      {
        "label": "Funding Status",
        "value": "Bootstrapped"
      }
    ]
  },
  "decentral-ai": {
    "overview": "A therapeutic hydrogel platform designed to improve chronic wound care by delivering treatment directly into damaged tissue through a conformable dressing.",
    "productSolution": "A hydrogel-based wound dressing that stabilizes therapeutic payloads and delivers them directly into tissue, supporting the management of chronic, nonhealing wounds.",
    "tractionMilestones": [
      "Demonstrated early post-market traction while progressing toward FDA 510(k) clearance.",
      "Secured an executed LOI for a commercial pilot following regulatory clearance.",
      "Engaged in advanced private-label discussions with a major medical-surgical distributor and its affiliated group purchasing organization.",
      "Developing commercialization opportunities alongside regulatory activities."
    ],
    "teamExpertise": [
      {
        "text": "Two team members are experienced medtech founders with a previous successful exit."
      },
      {
        "text": "Multidisciplinary team combines medical technology entrepreneurship with specialized industry expertise."
      },
      {
        "text": "Strong focus on rapid product development, market exploration, and iterative testing."
      }
    ],
    "funding": [
      {
        "label": "Previously Raised",
        "value": "$2.6M"
      },
      {
        "label": "Current Instrument",
        "value": "SAFE"
      },
      {
        "label": "Valuation Cap",
        "value": "$20M pre-money"
      },
      {
        "label": "Discount",
        "value": "80% (as stated by company)"
      },
      {
        "label": "Raised on Current Terms",
        "value": "$2.6M"
      }
    ]
  },
  "edulis-therapeutics": {
    "overview": "Making clinically graded compression therapy easier and more comfortable through innovative compression socks designed for everyday wear.",
    "productSolution": "Compression socks featuring inflatable chambers engineered to deliver clinically graded pressure while improving the everyday wearing experience.",
    "tractionMilestones": [
      "Successfully completed initial validation testing demonstrating clinically graded compression pressure.",
      "Selected for Georgia Tech's CREATE-X Startup Launch program.",
      "Featured by Hypepotamus as a startup to watch.",
      "Added Dennis Hayes, inventor of the PC modem, as an advisor.",
      "Established support from geriatricians at Emory University."
    ],
    "teamExpertise": [
      {
        "text": "Research experience at Georgia Tech's Yeo Lab."
      },
      {
        "text": "Engineering and product experience spanning four Apple internships."
      },
      {
        "text": "Supported by Emory University geriatricians, including Dr. Anna Mirk."
      },
      {
        "text": "Team includes former collegiate Division I track and rugby athletes."
      },
      {
        "text": "Advised by technology entrepreneur Dennis Hayes."
      }
    ],
    "funding": [
      {
        "label": "Previously Raised",
        "value": "$15K"
      },
      {
        "label": "Current Instrument",
        "value": "SAFE"
      },
      {
        "label": "Valuation Cap",
        "value": "Not specified"
      },
      {
        "label": "Raised on Current Terms",
        "value": "$15K"
      }
    ]
  }
};

export function companyDetailSections(companyId: string): readonly CompanyDetailSection[] {
  const details = detailsByCompanyId[companyId];
  if (!details) return [];
  return [
    { title: "Overview", kind: "paragraph", text: details.overview },
    { title: "Product / Solution", kind: "paragraph", text: details.productSolution },
    { title: "Traction & Milestones", kind: "bullets", items: details.tractionMilestones.map(text => ({ text })) },
    { title: "Team & Expertise", kind: "bullets", items: details.teamExpertise },
    { title: "Funding", kind: "funding", fields: details.funding },
  ];
}
