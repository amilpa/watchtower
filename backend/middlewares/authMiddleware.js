const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  // Check if authorization header exists and has the correct format
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      msg: "Authentication invalid",
    });
  }

  // Extract the token
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object
    req.user = { userId: payload.userId, name: payload.name };
    next();
  } catch (error) {
    // Handle token verification errors
    return res.status(401).json({
      msg: "Authentication invalid",
    });
  }
};

module.exports = auth;
