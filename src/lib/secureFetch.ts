export async function secureFetch(
  url: string,
  options: RequestInit = {}
) {
  return fetch(url, {
    ...options,
    credentials: "include", // 🔥 CRÍTICO
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });
}