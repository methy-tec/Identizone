import express from "express";
import { register, login, getAllAdmins, updateAdmin, getAdminById, refreshToken, getStatistics, meConnect } from "../controllers/adminController.js";
import upload from "../middlewares/multerMiddlewares.js";
import { verifyRole, verifyToken } from "../middlewares/authMiddlewares.js";

const router = express.Router();


// Statistiques
router.get("/statistics", verifyToken, verifyRole("admin", "preadmin"), getStatistics);

// CRUD routes
router.post("/", verifyToken, verifyRole("superadmin"), upload.single("photo"), register);
router.post("/login", login);
router.get("/list", verifyToken, verifyRole("superadmin"), getAllAdmins);
router.get("/me", verifyToken, meConnect);
router.put("/:id", upload.single("photo"), updateAdmin);
router.get("/:id", getAdminById);
router.post("/refresh", refreshToken);



export default router;
