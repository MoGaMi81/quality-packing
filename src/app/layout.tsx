// src/app/layout.tsx
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  const raw = cookies().get("qp_session")?.value ?? "";
  let role = "";

  try {
    const json = JSON.parse(decodeURIComponent(raw));
    role = json.role ?? "";
  } catch {
    role = "";
  }

  return (
    <html lang="en">
      <body data-role={role}>
        {children}
      </body>
    </html>
  );
}