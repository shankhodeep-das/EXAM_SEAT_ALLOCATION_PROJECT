const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getStudents() {

    const response = await fetch(
        `${API_URL}/api/students`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch students");
    }

    return response.json();
}