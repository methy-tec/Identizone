import express from "express";
import upload from "../middlewares/multerMiddlewares.js";
import {
  createPreAdmin,
  getAllPreAdmins,
  getPreAdminById,
  updatePreAdmin,
  deletePreAdmin,
  getStatistics,
  login
} from "../controllers/preAdminController.js";
import { verifyToken , verifyRole} from "../middlewares/authMiddlewares.js";

const router = express.Router();

router.post("/",verifyToken, verifyRole("admin"), upload.single("photo"), createPreAdmin);
router.post("/login", login);

router.get("/list",verifyToken, verifyRole("superadmin", "admin"), getAllPreAdmins);
router.get("/:id", verifyToken, verifyRole("superadmin","admin"), getPreAdminById);
router.get("/statistic", verifyToken, getStatistics);
router.put("/:id", verifyToken, upload.single("photo"), updatePreAdmin);
router.delete("/:id", verifyToken, verifyRole("superadmin", "admin"), deletePreAdmin);

export default router;
