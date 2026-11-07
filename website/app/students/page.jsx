import { getStudents } from "@/lib/api";

export default async function StudentsPage() {

    const data = await getStudents();

    return (
        <main className="p-10">

            <h1 className="text-3xl font-bold">
                CampusConnect Students
            </h1>

            <div className="mt-6 space-y-4">

                {data.students.map((student) => (

                    <div
                        key={student.id}
                        className="border p-4 rounded-lg"
                    >
                        <h2 className="font-bold">
                            {student.name}
                        </h2>

                        <p>{student.course}</p>

                    </div>

                ))}

            </div>

        </main>
    );
}