import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google';
import './globals.css';
import { ProjectProvider } from '@/lib/project-context';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/lib/auth-context';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UK ENTERPRISE — Office Administration System',
  description:
    'Internal enterprise project administration & project control for UK Enterprise power infrastructure operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${ibmPlexSerif.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
        <AuthProvider>
          <ProjectProvider>
            <AppShell>{children}</AppShell>
          </ProjectProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
