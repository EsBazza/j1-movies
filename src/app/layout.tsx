import type { Metadata, Viewport } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/Toast';
import { AmbientLayer } from '@/components/media/AmbientBackground';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0b',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: {
    default: 'J1 Movies - Cinema Streaming & Discovery',
    template: '%s | J1 Movies',
  },
  description:
    'Stream your favorite movies, TV series, anime, and Asian dramas with crystal-clear high definition, instant playback, and personal watchlist.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${montserrat.variable}`}>
      <body className="bg-bg font-sans text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-accent selection:text-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-full focus:bg-white focus:text-black focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <AmbientLayer />
        <Navbar />
        <main id="main" className="flex-1 w-full">
          {children}
        </main>
        <Footer />
        <MobileNav />
        <Toaster />
      </body>
    </html>
  );
}

