import express from "express";
import { register, login, refreshToken } from "../controllers/superAdminController.js";
import { Sequelize } from "sequelize";
import { verifyToken, verifyRole } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.get("/only", verifyToken, verifyRole("superadmin"), (req, res) => {
  res.json({ message: "Bienvenue Admin ✅" });
});

router.post('/register', register);
router.post('/login', login);
router.post("/refresh", refreshToken);



export default router;