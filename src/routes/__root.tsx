import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/theme-provider';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Outlet />
      <Toaster position="top-right" richColors closeButton duration={3000} />
    </ThemeProvider>
  );
}
