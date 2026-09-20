export interface ExpoInformation {
  slug: string;
  name: string;
  edition: string;
  introduction: string;
  dateLabel: string;
  hours: string;
  venue: string;
  address: string;
  admission: string;
  transport: string;
  accessibility: string[];
  faqs: { question: string; answer: string }[];
  isSample: boolean;
}
