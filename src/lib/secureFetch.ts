// src/lib/secureFetch.ts

export async function secureFetch(url: string, options: RequestInit = {}) {
  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;

  const headers = {
    "Content-Type": "application/json",
    "x-user-role": role || "",
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}