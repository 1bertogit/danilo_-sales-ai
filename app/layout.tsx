import React from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/nextjs';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body className="bg-gem-onyx text-gem-offwhite h-screen overflow-hidden">
          <SignedOut>
            <div className="flex items-center justify-center h-screen">
              <SignIn routing="hash" />
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