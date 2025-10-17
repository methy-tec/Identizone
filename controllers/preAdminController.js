import { PreAdmin, Admin, Habitat, Famille, Travailleur, Utilisateur } from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

import moment from "moment";

export const login = async (req, res) =>{
    try{
        const {username, password} = req.body;
        
        const user = await PreAdmin.findOne({ where: { username}});
        if (!user) return res.status(400).json({message: 'Utilisateur introuvable'});

        const hashedPassword = await bcrypt.hash(password, 10);

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) return res.status(400).json({ message: 'Mot de passse incorrect'});

        const token = jwt.sign({ id: user.id, role: user.role, adminId: user.adminId, habitatId: user.habitatId}, process.env.JWT_SECRET, {expiresIn: '1h'});
        const refreshToken = jwt.sign({ id: user.id, role: user.role}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "2h"});
        
        res.json({token, refreshToken, user: {id: user.id, nom_complet: user.nom_complet, username: user.username, role: user.role, habitatId: user.habitatId}});

    }catch (err){
        res.status(500).json({ message: err.message})
    }
}

// ➕ Créer un PreAdmin
export const createPreAdmin = async (req, res) => {
  try {
    // Vérification que c'est bien un admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Seul un Admin peut créer un Preadmin ❌" });
    }

    // Récupérer les champs du formulaire
    const {
      username,
      nom_complet,
      lieu_naissance,
      date_naissance,
      numero_tel,
      adresse,
      password,
    } = req.body;

    if (!username || !nom_complet || !lieu_naissance || !date_naissance || !numero_tel || !adresse || !password) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis ❌" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Photo (optionnelle)
    const photo = req.file ? req.file.filename : null;

    // Conversion de la date : accepte YYYY-MM-DD ou DD/MM/YYYY
    const isoDate = moment(date_naissance, ["YYYY-MM-DD", "DD/MM/YYYY"], true);
    if (!isoDate.isValid()) {
      return res.status(400).json({ message: "Date de naissance invalide ❌" });
    }

    // Création du PreAdmin
    const preAdmin = await PreAdmin.create({
      username,
      nom_complet,
      lieu_naissance,
      date_naissance: isoDate.format("YYYY-MM-DD"),
      numero_tel,
      adresse,
      password: hashedPassword,
      photo,
      adminId: req.user.id,
      habitatId: req.user.habitatId,
    });

    res.status(201).json({
      message: "PreAdmin créé avec succès ✅",
      preAdmin,
    });
  } catch (error) {
    console.error("Erreur createPreAdmin:", error);
    res.status(500).json({
      message: "Erreur lors de la création du PreAdmin ❌",
      error: error.message,
    });
  }
};


// 📋 Obtenir tous les PreAdmins
export const getAllPreAdmins = async (req, res) => {
  try {
    let preAdmins;

    if (req.user.role === "superadmin") {
      // superadmin → voit tous les preAdmins
      preAdmins = await PreAdmin.findAll({
        include: [
          { model: Admin, as: "Admin" },
          { model: Habitat, as: "Habitat" }
        ],
      });
    } else if (req.user.role === "admin") {
      // admin → voit seulement ses preAdmins
      preAdmins = await PreAdmin.findAll({
        where: { adminId: req.user.id },
        include: [
          { model: Admin, as: "Admin" },
          { model: Habitat, as: "Habitat" }
        ],
      });
    } else {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }

    res.json(preAdmins);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des PreAdmins ❌",
      error: error.message,
    });
  }
};

// 🔎 Obtenir un PreAdmin par ID
// 🔎 Obtenir un PreAdmin par ID
export const getPreAdminById = async (req, res) => {
  try {
    const preAdmin = await PreAdmin.findByPk(req.params.id, {
      include: [
        { model: Admin, as: "Admin" },
        { model: Habitat, as: "Habitat" }
      ],
    });

    if (!preAdmin) {
      return res.status(404).json({ message: "PreAdmin introuvable ❌" });
    }

    // Vérif des droits
    if (req.user.role === "superadmin" || 
        (req.user.role === "admin" && preAdmin.adminId === req.user.id)) {
      return res.json(preAdmin);
    }

    return res.status(403).json({ message: "⛔ Accès interdit" });

  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du PreAdmin ❌",
      error: error.message,
    });
  }
};

// ✏️ Modifier un PreAdmin
export const updatePreAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      nom_complet,
      date_naissance,
      numero_tel,
      adresse,
      password
    } = req.body;

    const preAdmin = await PreAdmin.findByPk(id);
    if (!preAdmin) return res.status(404).json({ message: "Pré-admin introuvable ❌" });

    // Conversion de la date
    const isoDate = moment(date_naissance, "YYYY-MM-DD").format("YYYY-MM-DD");
    const photo = req.file ? req.file.filename : preAdmin.photo;

    // Hachage du mot de passe si modifié
    let hashedPassword = preAdmin.password;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await preAdmin.update({
      username,
      nom_complet,
      date_naissance: isoDate,
      numero_tel,
      adresse,
      password: hashedPassword,
      photo,
    });

    res.status(200).json({ message: "Pré-admin mis à jour ✅", preAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du pré-admin ❌",
      error: error.message,
    });
  }
};


// 🗑️ Supprimer un PreAdmin
export const deletePreAdmin = async (req, res) => {
  try {
    const preAdmin = await PreAdmin.findByPk(req.params.id);
    if (!preAdmin) return res.status(404).json({ message: "PreAdmin introuvable ❌" });

    await preAdmin.destroy();
    res.json({ message: "PreAdmin supprimé avec succès ✅" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du PreAdmin ❌", error: error.message });
  }
};

// Rafraîchir le token
export const refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Token manquant ❌" });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role, habitatId: decoded.habitatId },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Refresh token invalide ❌", error: err.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const habitatId = req.user.habitatId;

    let familles = 0;
    let utilisateurs = 0;
    let travailleurs = 0;

    if (role === "preadmin") {
      // 🔹 Pré-admin : statistiques dans son habitat
      familles = await Famille.count({ where: { habitatId } });
      utilisateurs = await Utilisateur.count({ where: { habitatId } });
      travailleurs = await Travailleur.count({ where: { preAdminId: userId } });

    }

    res.json({ familles, utilisateurs, travailleurs });
  } catch (error) {
    console.error("Erreur statistiques:", error);
    res.status(500).json({ message: "Erreur récupération statistiques ❌", error: error.message });
  }
};
