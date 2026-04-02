/**
 * Universal Issue Tree template — fixed 4-branch structure.
 * Encodes the framework from decisions/Universal-Issue-Tree-Framework.md.
 *
 * The template defines branch IDs, labels, and sub-issues with their questions.
 * Ownership and coverage are populated at runtime during Stage 2 instantiation.
 */

export interface SubIssueTemplate {
  subIssueId: string;
  name: string;
  question: string;
}

export interface BranchTemplate {
  branchId: string;
  branchIndex: number;
  label: string;
  question: string;
  subIssues: SubIssueTemplate[];
}

export const TREE_TEMPLATE: BranchTemplate[] = [
  {
    branchId: "volume",
    branchIndex: 1,
    label: "Volume — Get More Customers",
    question: "Are we acquiring enough customers?",
    subIssues: [
      {
        subIssueId: "1.1",
        name: "Demand Generation",
        question: "How many potential customers are entering the top of the funnel?",
      },
      {
        subIssueId: "1.2",
        name: "Demand Conversion",
        question: "Of those, how many become qualified opportunities?",
      },
      {
        subIssueId: "1.3",
        name: "Closing",
        question: "Of qualified opportunities, how many become paying customers?",
      },
    ],
  },
  {
    branchId: "value",
    branchIndex: 2,
    label: "Value — Get More per Customer",
    question: "Are we maximising revenue per customer?",
    subIssues: [
      {
        subIssueId: "2.1",
        name: "Initial Deal Value",
        question: "How much does a customer pay on their first purchase/deal/booking?",
      },
      {
        subIssueId: "2.2",
        name: "Expansion Revenue",
        question: "Do customers buy more over time?",
      },
      {
        subIssueId: "2.3",
        name: "Pricing Alignment",
        question: "Is pricing matched to the value customers receive?",
      },
    ],
  },
  {
    branchId: "retention",
    branchIndex: 3,
    label: "Retention — Keep Customers Longer",
    question: "Are customers staying and getting value?",
    subIssues: [
      {
        subIssueId: "3.1",
        name: "Value Delivery",
        question: "Is the product/service actually solving the customer's problem?",
      },
      {
        subIssueId: "3.2",
        name: "Customer Health",
        question: "Are customers satisfied? Are they engaged? Are they at risk?",
      },
      {
        subIssueId: "3.3",
        name: "Churn Prevention",
        question: "Can we spot warning signs early and intervene?",
      },
      {
        subIssueId: "3.4",
        name: "Service Reliability",
        question: "Is the platform/service operating without friction?",
      },
    ],
  },
  {
    branchId: "capacity",
    branchIndex: 4,
    label: "Capacity — Scale the Above Three",
    question: "Can we do more of Volume, Value, and Retention?",
    subIssues: [
      {
        subIssueId: "4.1",
        name: "People Capacity",
        question: "Do we have enough people in the right roles?",
      },
      {
        subIssueId: "4.2",
        name: "Product / Service Capacity",
        question: "Are we building the right things? Can we deliver at scale?",
      },
      {
        subIssueId: "4.3",
        name: "Data & Decision-Making",
        question: "Do we have the data infrastructure to see what's working?",
      },
      {
        subIssueId: "4.4",
        name: "Market Knowledge",
        question: "Do we understand which segments, geographies, and channels to focus on?",
      },
    ],
  },
];

/** Default role → branch ownership mapping */
export const DEFAULT_OWNERSHIP: Record<string, string[]> = {
  volume: ["CEO", "VP Sales", "Head of Sales"],
  value: ["CEO", "VP Sales", "Customer Success Manager"],
  retention: ["Customer Success Manager", "CS Manager", "Support Lead"],
  capacity: ["CEO", "COO", "CTO"],
};

export const FORMULA_LABEL =
  "Revenue = Leads × Conversion Rate × Win Rate × Avg Deal Size × Expansion − Churn";
