import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SuperAdmin, Admin, PreAdmin, Utilisateur, Famille, Habitat } from "../models/index.js";

// Enregistrer un super admin
export const register = async (req, res) => {
  try {
    const { username, nom_complet, numero_tel, adresse, password } = req.body;

    const existingUser = await SuperAdmin.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: "Nom d'utilisateur déjà utilisé ❌" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = await SuperAdmin.create({
      username,
      nom_complet,
      numero_tel,
      adresse,
      password: hashedPassword,
    });

    res.status(201).json(superAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Connexion
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await SuperAdmin.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: "Utilisateur introuvable ❌" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Mot de passe incorrect ❌" });

    const token = jwt.sign({ id: user.id, role: "superadmin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ id: user.id, role: "superadmin" }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "2h",
    });

    res.json({
      token,
      refreshToken,
      user: { id: user.id, nom_complet: user.nom_complet, username: user.username, role: "superadmin" },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Rafraîchir token
export const refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Token manquant ❌" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role, habitatId: decoded.habitatId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Refresh token invalide ❌", error: err.message });
  }
};

// Statistiques
export const getStatistics = async (req, res) => {
  try {
    const superadmins = await SuperAdmin.count();
    const admins = await Admin.count();
    const preadmins = await PreAdmin.count();
    const familles = await Famille.count();
    const utilisateurs = await Utilisateur.count();
    const travailleurs = await Utilisateur.count({ where: { profession: "travailleur" } });
    const habitats = await Habitat.count();

    res.json({ superadmins, admins, preadmins, familles, utilisateurs, travailleurs, habitats });
  } catch (error) {
    console.error("Erreur statistiques:", error);
    res.status(500).json({ message: "Erreur récupération statistiques ❌" });
  }
};
