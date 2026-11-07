
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
    
    console.log("User fetched for login:", rollNo, email, password);
    const user = await prisma.user.findUnique({
      where: {
        studentRollNo: rollNo.trim(),
      },
      include: {
        role: true,
        student: true,
      },
    });

    if (
      !user ||
      !user.student ||
      user.role.roleGroup !== "STUDENT" ||
      user.email.toLowerCase() !== email.trim().toLowerCase() ||
      !user.isActive
    ) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    // Compare entered password with Student table's password hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.student.password
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
      message: "Student login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        rollNo: user.student.rollNo,
        fullName: user.student.fullName,
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
