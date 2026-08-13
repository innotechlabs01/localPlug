import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Feedback',
  description: 'Share your experience with LocalPlug',
  robots: { index: false, follow: true },
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col items-center justify-start">
      {children}
    </div>
  );
}
