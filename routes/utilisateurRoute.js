import express from "express";
import upload from "../middlewares/multerMiddlewares.js";
import { registerUtilisateur, declarerDeces, updateUtilisateur, deleteUtilisateur } from "../controllers/utilisateursController.js";
import { verifyRole, verifyToken } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/", verifyToken, upload.single("photo"), registerUtilisateur);

router.put("/:id/deces", verifyToken, verifyRole("superadmin", "admin", "preadmin"), declarerDeces );

router.put("/:id", verifyToken, verifyRole("superadmin", "admin", "preadmin"), updateUtilisateur);

router.delete("/:id", verifyToken, verifyRole("admin"), deleteUtilisateur);

export default router;