import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Quality Packing",
  description: "Sistema de gestión de packings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="max-w-6xl mx-auto p-4">
        <NavBar />
        {children}
      </body>
    </html>
  );
}