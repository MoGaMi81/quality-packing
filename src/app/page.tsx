import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const cookieStore = cookies();
  const session = cookieStore.get("qp_session");

  if (!session) {
    redirect("/login");
  }

  try {
    const parsed = JSON.parse(session.value);

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
    redirect("/login");
  }
}