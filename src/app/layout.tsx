import './globals.css';
import { Manrope, Space_Grotesk } from 'next/font/google';

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${bodyFont.variable} ${headingFont.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
