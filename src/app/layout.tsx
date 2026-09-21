import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'J1 Movies - Cinema Streaming & Discovery',
  description:
    'Stream your favorite movies, TV series, anime, and Asian dramas with crystal-clear high definition, instant playback, and personal watchlist.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable} ${bebasNeue.variable}`}>
      <body className="bg-[#0f1014] font-sans text-zinc-100 min-h-screen flex flex-col antialiased selection:bg-red-600 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}

