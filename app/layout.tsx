import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth'; // If needed for provider
import { ThemeProvider } from '@/context/ThemeContext';




export const metadata: Metadata = {
  title: ' Dashboard',
  description: 'A learning management system dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        
      </head>
      <body>
        <ThemeProvider>
            <Toaster />
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}