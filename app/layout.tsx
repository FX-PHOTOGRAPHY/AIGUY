import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Acoustic Lab — Alpha',
  description: 'A safe laboratory for studying acoustic signatures and detector robustness.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang='en'><body>{children}</body></html>;
}
