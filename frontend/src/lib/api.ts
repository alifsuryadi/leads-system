import { LeadsResponse, SentimentResponse } from '@/types/lead';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function createLead(data: {
  name: string;
  email: string;
  campaignId: string;
}) {
  const res = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const messages: string[] = Array.isArray(err.message)
      ? err.message
      : [err.message || 'Failed to create lead'];
    throw new Error(messages.join(', '));
  }

  return res.json();
}

export async function getLeads(page = 1, limit = 10): Promise<LeadsResponse> {
  const res = await fetch(`${API_URL}/leads?page=${page}&limit=${limit}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

export async function analyzeSentiment(text: string): Promise<SentimentResponse> {
  const res = await fetch(`${API_URL}/sentiment/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to analyze sentiment');
  }

  return res.json();
}
