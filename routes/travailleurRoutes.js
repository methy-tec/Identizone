import express from "express";
import upload from "../middlewares/multerMiddlewares.js";
import { createTravailler, login, getAllTravailleurs, getTravailleurById, updateStatut, deleteTravailler, refreshToken } from "../controllers/travaillerController.js";
import { verifyRole, verifyToken } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/", verifyToken, verifyRole("preadmin"), upload.single("photo"), createTravailler);
router.post("/login", login);
router.get("/list", verifyToken, verifyRole("superadmin", "admin", "preadmin"), getAllTravailleurs);
router.get("/:id", verifyToken, getTravailleurById);
router.put("/:id/statut", verifyToken, verifyRole("admin", "preadmin"), updateStatut);
router.delete("/:id", verifyToken, verifyRole("admin", "preadmin"), deleteTravailler);
router.post("/refresh", refreshToken);



export default router;
