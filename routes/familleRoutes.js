import express from "express";
import { createFamille, updateStatutParent, getFamillesWithParentsDecedes, getFamillesByUser, updateFamille, deleteFamille } from "../controllers/familleController.js";
import { verifyToken, verifyRole } from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/",verifyToken, createFamille);

router.put("/:id/update-parent", verifyToken, verifyRole("admin", "preadmin"), updateStatutParent);
// 📋 Voir les familles avec au moins un parent décédé
router.get("/parents-decedes", verifyToken, verifyRole("admin", "preadmin"), getFamillesWithParentsDecedes);

// 📋 Admin ou PréAdmin → voit uniquement les familles qui lui sont liées
router.get("/mes-familles", verifyToken, getFamillesByUser);

// ✏️ Modifier une famille
router.put("/:id", verifyToken, updateFamille);

// 🗑️ Supprimer une famille (et ses utilisateurs)
router.delete("/:id", verifyToken, verifyRole("admin"), deleteFamille);
export default router;