import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Leads Management System',
  description: 'Full-stack leads management with AI sentiment analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-indigo-600 text-white shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold tracking-tight">Leads Management System</h1>
            <p className="text-indigo-200 text-sm mt-0.5">Usaha Kreatif Indonesia — Engineering Assessment</p>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">{children}</main>
      </body>
    </html>
  );
}
