const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
// GET: Fetch all students
const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};

// POST: Add a new student
const createStudent = async (req, res) => {
  try {
    const {
      rollNo,
      fullName,
      email,
      password,
      section,
      semester,
      courseId,
    } = req.body;

    // Validate required fields
    if (
      !rollNo ||
      !fullName ||
      !email ||
      !password ||
      !section ||
      semester === undefined ||
      courseId === undefined
    ) {
      return res.status(400).json({
        message: "All student fields are required",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters",
      });
    }

    const normalizedRollNo = rollNo.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const parsedSemester = Number(semester);
    const parsedCourseId = Number(courseId);

    if (
      !Number.isInteger(parsedSemester) ||
      parsedSemester < 1 ||
      !Number.isInteger(parsedCourseId) ||
      parsedCourseId < 1
    ) {
      return res.status(400).json({
        message: "Invalid semester or course ID",
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: parsedCourseId },
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Check for existing student or email
    const [existingStudent, existingUser] = await Promise.all([
      prisma.student.findUnique({
        where: { rollNo: normalizedRollNo },
      }),
      prisma.user.findUnique({
        where: { email: normalizedEmail },
      }),
    ]);

    if (existingStudent || existingUser) {
      return res.status(409).json({
        message: "Roll number or email already exists",
      });
    }

    // Find the STUDENT role
    const studentRole = await prisma.role.findUnique({
      where: { roleName: "STUDENT" },
    });

    if (!studentRole || studentRole.roleGroup !== "STUDENT") {
      return res.status(500).json({
        message: "Student role is not configured",
      });
    }

    // Hash password for Student.password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Student and User together
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          rollNo: normalizedRollNo,
          fullName: fullName.trim(),
          section: section.trim(),
          semester: parsedSemester,
          courseId: parsedCourseId,
          password: hashedPassword,
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          roleId: studentRole.id,
          studentRollNo: student.rollNo,
          // Student password is stored only in Student.password
          // Do not copy it into User.passwordHash.
          passwordHash: "",
        },
      });

      return {
        student,
        user,
      };
    });

    return res.status(201).json({
      message: "Student created successfully",
      student: {
        rollNo: result.student.rollNo,
        fullName: result.student.fullName,
        email: result.user.email,
        section: result.student.section,
        semester: result.student.semester,
        courseId: result.student.courseId,
      },
    });

  } catch (error) {
    console.error("Create student error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Roll number or email already exists",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  getStudents,
  createStudent,
};