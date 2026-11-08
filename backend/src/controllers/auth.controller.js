
const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Generate authentication token
function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user.id,
      role: user.role.roleName,
      roleGroup: user.role.roleGroup,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

// STUDENT LOGIN


exports.studentLogin = async (req, res) => {
  try {
    const { rollNo, email, password } = req.body;

    if (!rollNo || !email || !password) {
      return res.status(400).json({
        message: "Roll number, email and password are required",
      });
    }

    // STEP 1: Find student in Student table
    const student = await prisma.student.findUnique({
      where: {
        rollNo: rollNo.trim(),
      },
    });
    console.log("Student found:", student);

    if (!student) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    // STEP 2: Verify password against Student.password
    const passwordMatch = await bcrypt.compare(
      password,
      student.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    // STEP 3: Find linked User account using student roll number
    const user = await prisma.user.findUnique({
      where: {
        studentRollNo: student.rollNo,
      },
      include: {
        role: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      user.email.toLowerCase() !== email.trim().toLowerCase() ||
      user.role.roleGroup !== "STUDENT"
    ) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    // STEP 4: Generate JWT
    const token = generateToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // STEP 5: Return student information
    return res.status(200).json({
      message: "Student login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        rollNo: student.rollNo,
        fullName: student.fullName,
        section: student.section,
        semester: student.semester,
        role: user.role.roleName,
        roleGroup: user.role.roleGroup,
      },
    });

  } catch (error) {
    console.error("Student login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



// FACULTY / OFFICIAL / ADMIN LOGIN
exports.staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        role: true,
        faculty: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      !["STAFF", "ADMIN"].includes(user.role.roleGroup) ||
      (user.role.roleGroup === "STAFF" && !user.faculty)
    ) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    const token = generateToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.faculty?.fullName || null,
        employeeId: user.faculty?.employeeId || null,
        staffType: user.faculty?.staffType || null,
        role: user.role.roleName,
        roleGroup: user.role.roleGroup,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
