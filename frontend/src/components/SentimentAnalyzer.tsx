'use client';

import { useState } from 'react';
import { analyzeSentiment } from '@/lib/api';
import { SentimentResponse } from '@/types/lead';

export default function SentimentAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<SentimentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeSentiment(text.trim());
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const isPositive = result?.sentiment === 'positive';

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">AI Sentiment Analyzer</h2>
      <p className="text-sm text-gray-500 mb-5">
        Powered by the Python microservice — enter any text to analyze its sentiment.
      </p>

      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. This product is amazing and I love using it every day!"
          maxLength={1000}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{text.length}/1000</span>
          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Sentiment'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div
            className={`rounded-xl border p-5 ${
              isPositive
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{isPositive ? '😊' : '😞'}</span>
              <div>
                <p className="font-semibold text-base capitalize" style={{ color: isPositive ? '#16a34a' : '#dc2626' }}>
                  {result.sentiment}
                </p>
                <p className="text-xs text-gray-500">
                  Confidence: {Math.round(result.confidence * 100)}%
                </p>
              </div>
            </div>

            {result.matched_keywords.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Matched keywords:</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matched_keywords.map((kw) => (
                    <span
                      key={kw}
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        isPositive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.matched_keywords.length === 0 && (
              <p className="text-xs text-gray-500">
                No specific keywords detected — defaulted to neutral/negative.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
