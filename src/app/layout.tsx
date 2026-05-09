import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sublimação Personalizada',
  description: 'Crie produtos únicos com sua foto',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
