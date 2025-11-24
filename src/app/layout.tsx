// app/layout.tsx
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Aquí Next inyectará el rol */}
        <meta name="x-user-role" content="" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
