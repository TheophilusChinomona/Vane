export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'sonner';
import ThemeProvider from '@/components/theme/Provider';
import configManager from '@/lib/config';
import SetupWizard from '@/components/Setup/SetupWizard';
import { ChatProvider } from '@/lib/hooks/useChat';
import { getSession } from '@/lib/auth-session';

const montserrat = Montserrat({ weight: ['300', '400', '500', '700'], subsets: ['latin'], display: 'swap', fallback: ['Arial', 'sans-serif'] });
export const metadata: Metadata = { title: 'Vane - Direct your curiosity', description: 'Vane is an AI powered answering engine.' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  const setupComplete = configManager.isSetupComplete();
  const configSections = configManager.getUIConfigSections();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'admin';
  return <html className="h-full" lang="en" suppressHydrationWarning><body className={cn('h-full antialiased', montserrat.className)}><ThemeProvider>{!session ? children : setupComplete || !isAdmin ? <ChatProvider><Sidebar>{children}</Sidebar><Toaster toastOptions={{ unstyled: true, classNames: { toast: 'bg-light-secondary dark:bg-dark-secondary dark:text-white/70 text-black-70 rounded-lg p-4 flex flex-row items-center space-x-2' } }} /></ChatProvider> : <SetupWizard configSections={configSections} />}</ThemeProvider></body></html>;
}
