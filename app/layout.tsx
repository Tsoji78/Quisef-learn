import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth'; // If needed for provider




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
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // On page load or when changing themes, best to add inline in \`head\` to avoid FOUC
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body>
        <Toaster />
        {children}
      </body>
    </html>
  );
}