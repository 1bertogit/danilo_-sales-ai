import React from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';

// Premium typography setup
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata = {
  title: 'Danilo | Sales OS',
  description: 'AI-Powered Sales CRM for Brandão Facial Institute',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // During build without publishableKey, render without Clerk
  if (!publishableKey) {
    return (
      <html lang="pt-BR" className={`${outfit.variable} ${inter.variable}`}>
        <body className="font-body bg-surface-50 text-surface-900 h-screen overflow-hidden antialiased">
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="pt-BR" className={`${outfit.variable} ${inter.variable}`}>
        <body className="font-body bg-surface-50 text-surface-900 h-screen overflow-hidden antialiased">
          <SignedOut>
            {/* Premium Sign-in Screen */}
            <div className="min-h-screen bg-surface-50 bg-mesh flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                {/* Brand header */}
                <div className="text-center mb-8 animate-fade-in-up">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-jade-gradient shadow-jade-lg mb-5">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h1 className="font-display text-3xl font-bold text-surface-900 mb-2">
                    Danilo <span className="text-jade-gradient">Sales OS</span>
                  </h1>
                  <p className="text-surface-500">
                    Brandão Facial Institute
                  </p>
                </div>

                {/* Clerk Sign-in */}
                <div className="glass-card p-1 animate-fade-in-up delay-150">
                  <SignIn
                    routing="hash"
                    appearance={{
                      elements: {
                        rootBox: 'w-full',
                        card: 'shadow-none bg-transparent',
                        headerTitle: 'font-display',
                        formButtonPrimary: 'bg-jade-600 hover:bg-jade-700',
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            {children}
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
