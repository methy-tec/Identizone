import { PreAdmin, Admin, Habitat } from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

import moment from "moment";

export const login = async (req, res) =>{
    try{
        const {username, password} = req.body;
        
        const user = await PreAdmin.findOne({ where: { username}});
        if (!user) return res.status(400).json({message: 'Utilisateur introuvable'});

        const hashedPassword = await bcrypt.hash(password, 10);

        const valid = await bcrypt.compare(password, hashedPassword);
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
    const {
      username,
      nom_complet,
      lieu_naissance,
      date_naissance, // format DD/MM/YYYY
      numero_tel,
      adresse,
      password,
    } = req.body;

    if (!req.user || req.user.role != "admin") {
      return res.status(400).json({ message: "Seul un Admin peut cree un Preadmin ❌" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    

    const photo = req.file ? req.file.filename : null;

    // Conversion de la date
    const isoDate = moment(date_naissance, "DD/MM/YYYY").format("YYYY-MM-DD");

    const preAdmin = await PreAdmin.create({
      username,
      nom_complet,
      lieu_naissance,
      date_naissance: isoDate,
      numero_tel,
      adresse,
      password: hashedPassword,
      photo,
      adminId: req.user.id,
      habitatId: req.user.habitatId
    });

    res.status(201).json({
      message: "PreAdmin créé avec succès ✅",
      preAdmin,
    });
  } catch (error) {
    console.log(error);
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
    const preAdmin = await PreAdmin.findByPk(req.params.id);
    if (!preAdmin) return res.status(404).json({ message: "PreAdmin introuvable ❌" });

    const { username, nom_complet, lieu_naissance, date_naissance, numero_tel, adresse } = req.body;
    const photo = req.file ? req.file.filename : null;
    const isoDate = date_naissance ? moment(date_naissance, "DD/MM/YYYY").format("YYYY-MM-DD") : preAdmin.date_naissance;

    await preAdmin.update({
      username: username || preAdmin.username,
      nom_complet: nom_complet || preAdmin.nom_complet,
      lieu_naissance: lieu_naissance || preAdmin.lieu_naissance,
      date_naissance: isoDate,
      numero_tel: numero_tel || preAdmin.numero_tel,
      adresse: adresse || preAdmin.adresse,
      photo: photo || preAdmin.photo,
    });

    res.json({ message: "PreAdmin modifié avec succès ✅", preAdmin });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification du PreAdmin ❌", error: error.message });
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
