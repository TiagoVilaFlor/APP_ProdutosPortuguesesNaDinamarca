import "./globals.css";

export const metadata = {
  title: "Seleção de Produtos Portugueses",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-neutral-100">
        <div className="mx-auto min-h-screen max-w-md bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
