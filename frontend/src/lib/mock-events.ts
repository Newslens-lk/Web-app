// Placeholder mock data for the prototype UI.
// Every outlet name is real (from the project's source list), but every bias value
// here is illustrative demo data — never present these as real assessments.

export type BiasBucket = "fl" | "l" | "c" | "r" | "fr";

export type BiasDistribution = Record<BiasBucket, number>;

export type Outlet = {
  id: string;
  short: string; // 2-3 char avatar label
  name: string;
  color: string; // hex used for the avatar background
};

export type Event = {
  id: string;
  topic: string;
  headline: string;
  dek: string;
  outletCount: number;
  distribution: BiasDistribution;
  outlets: Outlet[]; // first 3-4 shown as an avatar stack on the card
  updatedAgo: string;
};

export const events: Event[] = [
  {
    id: "e-4471",
    topic: "Economy",
    headline: "Central Bank holds policy rate amid inflation concerns",
    dek: "The Monetary Board kept the Standing Lending Rate unchanged for a third straight review, citing balanced risks to the inflation outlook.",
    outletCount: 9,
    distribution: { fl: 0, l: 3, c: 2, r: 3, fr: 1 },
    outlets: [
      { id: "ad", short: "AD", name: "Ada Derana", color: "#2C5C8A" },
      { id: "hn", short: "HN", name: "Hiru News", color: "#6C97C0" },
      { id: "ld", short: "LD", name: "Lankadeepa", color: "#9C9482" },
      { id: "n1", short: "N1", name: "News 1st", color: "#C98552" },
    ],
    updatedAgo: "2h ago",
  },
  {
    id: "e-4470",
    topic: "Politics",
    headline:
      "Parliament passes amended Local Government bill after late-night debate",
    dek: "The bill cleared its second reading 118–63 following six hours of debate over ward delimitation changes.",
    outletCount: 11,
    distribution: { fl: 2, l: 2, c: 1, r: 2, fr: 2 },
    outlets: [
      { id: "dv", short: "DV", name: "Divaina", color: "#9C3F26" },
      { id: "ad", short: "AD", name: "Ada Derana", color: "#2C5C8A" },
      { id: "sl", short: "SL", name: "Silumina", color: "#6C97C0" },
      { id: "ti", short: "TI", name: "The Island", color: "#9C9482" },
    ],
    updatedAgo: "5h ago",
  },
  {
    id: "e-4469",
    topic: "Foreign Affairs",
    headline:
      "IMF review mission arrives in Colombo for fourth programme assessment",
    dek: "Officials will meet with Treasury and Central Bank counterparts over the next ten days to assess reform benchmarks.",
    outletCount: 7,
    distribution: { fl: 1, l: 3, c: 3, r: 2, fr: 0 },
    outlets: [
      { id: "hn", short: "HN", name: "Hiru News", color: "#6C97C0" },
      { id: "ct", short: "CT", name: "Ceylon Today", color: "#C98552" },
      { id: "ad", short: "AD", name: "Ada Derana", color: "#2C5C8A" },
    ],
    updatedAgo: "8h ago",
  },
  {
    id: "e-4468",
    topic: "Crime & Courts",
    headline: "High Court hands down verdict in long-running fraud case",
    dek: "A three-judge bench delivered a split ruling on two of the five counts, with sentencing scheduled for next month.",
    outletCount: 6,
    distribution: { fl: 1, l: 1, c: 4, r: 1, fr: 1 },
    outlets: [
      { id: "ld", short: "LD", name: "Lankadeepa", color: "#9C9482" },
      { id: "dv", short: "DV", name: "Divaina", color: "#9C3F26" },
      { id: "itn", short: "ITN", name: "ITN News", color: "#2C5C8A" },
    ],
    updatedAgo: "11h ago",
  },
  {
    id: "e-4467",
    topic: "Infrastructure",
    headline:
      "Colombo–Katunayake expressway lane closures extended after flood damage",
    dek: "The RDA says repairs to a subsided shoulder section will keep two lanes closed through the weekend.",
    outletCount: 5,
    distribution: { fl: 0, l: 1, c: 5, r: 1, fr: 0 },
    outlets: [
      { id: "sl", short: "SL", name: "Silumina", color: "#6C97C0" },
      { id: "n1", short: "N1", name: "News 1st", color: "#C98552" },
      { id: "ti", short: "TI", name: "The Island", color: "#9C9482" },
    ],
    updatedAgo: "1d ago",
  },
  {
    id: "e-4466",
    topic: "Sport",
    headline: "Selectors name provisional squad ahead of home Test series",
    dek: "Two uncapped seam bowlers earn call-ups as the panel rotates the pace attack for the first time this season.",
    outletCount: 8,
    distribution: { fl: 0, l: 1, c: 6, r: 1, fr: 0 },
    outlets: [
      { id: "ad", short: "AD", name: "Ada Derana", color: "#2C5C8A" },
      { id: "hn", short: "HN", name: "Hiru News", color: "#9C3F26" },
      { id: "itn", short: "ITN", name: "ITN News", color: "#6C97C0" },
    ],
    updatedAgo: "1d ago",
  },
];
