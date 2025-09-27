const jwt = require("jsonwebtoken");

// 🔹 Generate token with role included
const generateToken = (user, role) => {
  return jwt.sign(
    { id: user._id, email: user.email, role }, // role included
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};


// 🔹 Verify token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
};
