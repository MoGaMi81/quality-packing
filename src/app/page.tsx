import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const cookieStore = cookies();
  const session = cookieStore.get("qp_session");

  // 🚫 NO hay cookie → login
  if (!session?.value) {
    redirect("/login");
  }

  try {
    const parsed = JSON.parse(session.value);

    // 🚫 session inválida
    if (!parsed?.role) {
      redirect("/login");
    }

    if (parsed.role === "admin") {
      redirect("/admin");
    }

    if (parsed.role === "proceso") {
      redirect("/drafts");
    }

    if (parsed.role === "facturacion") {
      redirect("/facturacion");
    }

    // fallback
    redirect("/login");
  } catch {
    // 🚫 JSON corrupto → limpiar y login
    redirect("/login");
  }
}