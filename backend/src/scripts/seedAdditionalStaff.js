
require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env")
});

const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Generate 1,000 unique combinations of demo names.
const firstNames = [
    "Aarav", "Aditya", "Ananya", "Arjun", "Ayesha",
    "Dev", "Diya", "Ishaan", "Isha", "Kabir",
    "Kavya", "Krishna", "Madhav", "Meera", "Neha",
    "Nikhil", "Pooja", "Pranav", "Priya", "Rahul",
    "Riya", "Rohan", "Sanjana", "Saurav", "Shreya",
    "Sneha", "Tanvi", "Varun", "Vikram", "Yash",
    "Abhishek", "Akash", "Aniket", "Deepak", "Ira",
    "Karan", "Manish", "Nandini", "Raj", "Siddharth"
];

const lastNames = [
    "Sharma", "Das", "Roy", "Sen", "Mukherjee",
    "Banerjee", "Chatterjee", "Dutta", "Ghosh", "Bose",
    "Sarkar", "Mitra", "Gupta", "Verma", "Singh",
    "Kumar", "Malhotra", "Mehta", "Reddy", "Patel",
    "Kapoor", "Jain", "Sinha", "Nair", "Rao",
    "Chakraborty", "Bhattacharya", "Paul", "Mondal", "Datta"
];

const departments = [
    "Computer Science & Engineering",
    "Computer Applications",
    "Information Technology",
    "Electrical Engineering",
    "Electronics & Communication",
    "Mechanical Engineering",
    "Civil Engineering",
    "Biotechnology",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Management Studies",
    "Commerce",
    "English",
    "Education"
];

const designations = [
    "Assistant Professor",
    "Associate Professor",
    "Professor",
    "Senior Assistant Professor",
    "Lecturer"
];

function randomItem(array) {
    return array[crypto.randomInt(0, array.length)];
}

function generatePassword() {
    return crypto.randomBytes(12).toString("base64url");
}

function csvEscape(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
}

async function main() {
    console.log("\n========== SEATWISE STAFF SEED ==========\n");

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing in .env");
    }

    // Find roles by name instead of assuming their IDs.
    const facultyRole = await prisma.role.findUnique({
        where: { roleName: "FACULTY" }
    });

    const officerRole = await prisma.role.findUnique({
        where: { roleName: "EXAM_OFFICER" }
    });

    if (!facultyRole || !officerRole) {
        throw new Error("FACULTY or EXAM_OFFICER role not found.");
    }

    const staffToCreate = [];

    // Generate 1,000 faculty members.
    for (let i = 1701; i <= 1801; i++) {
        const index = i - 1701;

        const fullName =
            `${firstNames[index % firstNames.length]} ` +
            `${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;

        staffToCreate.push({
            employeeId: `DEMO-FAC-${String(i).padStart(3, "0")}`,
            email: `demo-fac-${String(i).padStart(3, "0")}@seatwise.demo`,
            fullName,
            department: randomItem(departments),
            designation: randomItem(designations),
            staffType: "FACULTY",
            roleId: facultyRole.id
        });
    }

    // Check existing employee IDs and emails.
    const employeeIds = staffToCreate.map(s => s.employeeId);
    const emails = staffToCreate.map(s => s.email);

    const existingFaculty = await prisma.faculty.findMany({
        where: {
            employeeId: { in: employeeIds }
        },
        select: {
            employeeId: true
        }
    });

    const existingUsers = await prisma.user.findMany({
        where: {
            email: { in: emails }
        },
        select: {
            email: true
        }
    });

    const existingEmployeeIds = new Set(
        existingFaculty.map(s => s.employeeId)
    );

    const existingEmails = new Set(
        existingUsers.map(u => u.email)
    );

    const credentials = [];
    let createdFaculty = 0;
    let createdOfficers = 0;
    let skipped = 0;

    for (const staff of staffToCreate) {
        if (
            existingEmployeeIds.has(staff.employeeId) ||
            existingEmails.has(staff.email)
        ) {
            console.log(`Skipped existing: ${staff.employeeId}`);
            skipped++;
            continue;
        }

        const temporaryPassword = generatePassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);

        // Create Faculty and linked User together.
        await prisma.$transaction(async (tx) => {
            const faculty = await tx.faculty.create({
                data: {
                    employeeId: staff.employeeId,
                    fullName: staff.fullName,
                    department: staff.department,
                    designation: staff.designation,
                    staffType: staff.staffType,
                    joiningDate: new Date(),
                    isActive: true
                }
            });

            await tx.user.create({
                data: {
                    email: staff.email,
                    passwordHash,
                    roleId: staff.roleId,
                    facultyId: faculty.id,
                    isActive: true
                }
            });
        });

        credentials.push({
            employeeId: staff.employeeId,
            fullName: staff.fullName,
            email: staff.email,
            temporaryPassword,
            role: staff.staffType === "FACULTY"
                ? "FACULTY"
                : "EXAM_OFFICER"
        });

        if (staff.staffType === "FACULTY") {
            createdFaculty++;
        } else {
            createdOfficers++;
        }

        if ((createdFaculty + createdOfficers) % 25 === 0) {
            console.log(
                `Created ${createdFaculty + createdOfficers} accounts...`
            );
        }
    }

    // Save credentials in a unique local CSV file.
    if (credentials.length > 0) {
        const csvRows = [
            [
                "employeeId",
                "fullName",
                "email",
                "temporaryPassword",
                "role"
            ].join(",")
        ];

        for (const account of credentials) {
            csvRows.push([
                account.employeeId,
                account.fullName,
                account.email,
                account.temporaryPassword,
                account.role
            ].map(csvEscape).join(","));
        }

        const fileName = `staff-credentials-${Date.now()}.csv`;
        const filePath = path.join(__dirname, fileName);

        await fs.writeFile(
            filePath,
            csvRows.join("\n"),
            "utf8"
        );

        console.log(`\nCredentials saved: ${filePath}`);
    }

    console.log("\n========== SEED SUMMARY ==========");
    console.log(`Faculty created: ${createdFaculty}`);
    console.log(`Exam officers created: ${createdOfficers}`);
    console.log(`Total accounts created: ${createdFaculty + createdOfficers}`);
    console.log(`Skipped existing records: ${skipped}`);
    console.log("==================================\n");
}

main()
    .catch(error => {
        console.error("\nStaff seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
