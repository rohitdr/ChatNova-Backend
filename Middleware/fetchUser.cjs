const jwt = require('jsonwebtoken');

const fetchUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        message: "Authorization token missing. Please login to continue."
      });
    }

    const token = authHeader.split(" ")[1].trim();

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

  
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: "Invalid or expired token."
    });
  }
};

module.exports = fetchUser;