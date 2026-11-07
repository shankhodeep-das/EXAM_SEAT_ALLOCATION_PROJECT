
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// Verify token and fetch the latest user role from database
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: Number(decoded.sub),
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid or inactive account",
      });
    }

    // Attach current database user information
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.roleName,
      roleGroup: user.role.roleGroup,
    };

    next();

  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Allow only ADMIN-group users
exports.authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.roleGroup !== "ADMIN") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
};
