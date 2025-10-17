// middlewares/verifyToken.js
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // format attendu: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "⛔ Token manquant" });
  }

  console.log("Token décodé:", req.user);


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // on stocke { id, role } dans req
    next();
  } catch (err) {
    return res.status(401).json({ message: "⛔ Token invalide" });
  }
};

// middlewares/verifyRole.js
export const verifyRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    next();
  };
};
