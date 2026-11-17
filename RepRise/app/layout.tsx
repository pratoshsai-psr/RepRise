import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RepRise — Train with Intention',
  description: 'Your training, recovery and progress in one place.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#1685f5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
