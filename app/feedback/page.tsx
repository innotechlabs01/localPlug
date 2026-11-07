import { Suspense } from 'react';
import FeedbackPageClient from '@/app/components/feedback/feedback-page';

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center">
          <div className="text-[var(--text-muted)] text-sm">Loading...</div>
        </div>
      }
    >
      <FeedbackPageClient />
    </Suspense>
  );
}
