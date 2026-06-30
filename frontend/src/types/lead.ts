export interface Lead {
  id: string;
  name: string;
  email: string;
  campaignId: string;
  createdAt: string;
}

export interface LeadsResponse {
  data: Lead[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SentimentResponse {
  text: string;
  sentiment: 'positive' | 'negative';
  confidence: number;
  matched_keywords: string[];
}
