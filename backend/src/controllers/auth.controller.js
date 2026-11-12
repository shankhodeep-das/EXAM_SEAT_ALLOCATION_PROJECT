
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

exports.updateStudentPassword = async (req, res) => {
  try {
    if (req.user.roleGroup !== "STUDENT") {
      return res.status(403).json({
        message: "Student access required",
      });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      currentPassword.length === 0 ||
      newPassword.length < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Enter your current password and a new password of 8 to 72 characters",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        student: {
          select: {
            rollNo: true,
            password: true,
          },
        },
      },
    });

    if (!user?.student) {
      return res.status(404).json({
        message: "Student account not found",
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.student.password
    );
    if (!currentPasswordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "Choose a new password different from your current password",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.student.update({
      where: { rollNo: user.student.rollNo },
      data: { password: passwordHash },
    });

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Student password update error:", error);
    return res.status(500).json({
      message: "Unable to update password",
    });
  }
};

exports.updateStaffPassword = async (req, res) => {
  try {
    if (!["STAFF", "ADMIN"].includes(req.user.roleGroup)) {
      return res.status(403).json({
        message: "Official access required",
      });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      currentPassword.length === 0 ||
      newPassword.length < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "Enter your current password and a new password of 8 to 72 characters",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return res.status(404).json({
        message: "Official account password is unavailable",
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );
    if (!currentPasswordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({
        message: "Choose a new password different from your current password",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Official password update error:", error);
    return res.status(500).json({
      message: "Unable to update password",
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
