// src/app/layout.tsx
import type { ReactNode } from "react";
import { headers } from "next/headers";

export default function RootLayout({ children }: { children: ReactNode }) {
  const h = headers();
  const role = h.get("x-user-role") ?? ""; // ← viene del middleware

  return (
    <html lang="en">
      <body data-role={role}> 
        {children}
      </body>
    </html>
  );
}
