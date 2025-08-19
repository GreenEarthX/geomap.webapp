import './globals.css';
import GexHeader from './components/GexHeader';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      
      <body className="bg-gray-50 min-h-screen">
        <GexHeader />
        <main className="pt-0">{children}</main>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
