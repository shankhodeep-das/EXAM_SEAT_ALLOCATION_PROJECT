
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function getStudents() {
  if (!API_URL) {
    throw new Error("API URL is not configured");
  }

  const response = await fetch(
    `${API_URL}/api/students`
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return await response.json();
}
