'use client';

import { useState } from 'react';
import LeadForm from '@/components/LeadForm';
import LeadsTable from '@/components/LeadsTable';
import SentimentAnalyzer from '@/components/SentimentAnalyzer';

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLeadCreated = () => {
    setRefreshTrigger((n) => n + 1);
  };

  return (
    <div className="space-y-8">
      {/* Task A: Lead Form + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <LeadForm onSuccess={handleLeadCreated} />
        <LeadsTable refreshTrigger={refreshTrigger} />
      </div>

      {/* Task C: AI Sentiment Analyzer */}
      <SentimentAnalyzer />
    </div>
  );
}
