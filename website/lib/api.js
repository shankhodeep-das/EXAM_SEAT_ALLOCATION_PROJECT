
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest(endpoint, options = {}) {
  if (!API_URL) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export async function downloadPdf(endpoint, options = {}) {
  if (!API_URL) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: options.headers,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Unable to download the PDF");
  }

  if (!response.headers.get("content-type")?.includes("application/pdf")) {
    throw new Error("The server did not return a PDF document.");
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || "download.pdf";

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
}
