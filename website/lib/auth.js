const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function verifyToken() {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response)
    if (!response.ok) {
      throw new Error(`Authentication API returned ${response.status}`);
    }

    const data = await response.json();

    localStorage.setItem("user", JSON.stringify(data.user));

    return data.user;
  } catch (error) {
    console.error("Authentication verification failed:", error);
    return null;
  }
}