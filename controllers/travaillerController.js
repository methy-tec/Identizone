import moment from "moment";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

import { Travailleur} from "../models/index.js";

export const createTravailler = async (req, res) => {
   try {
    const {username, nom_complet, lieu_naissance, date_naissance, numero_tel, adresse, password,} = req.body;
        const photo = req.file ? req.file.filename : null;
        const isoDate = moment(date_naissance, "DD/MM/YYYY").format("YYYY-MM-DD");

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const travailleur = await Travailleur.create({
            username,
            nom_complet,
            lieu_naissance,
            date_naissance: isoDate,
            numero_tel,
            adresse,
            password: hashedPassword,
            photo,
            preAdminId: req.user.id,
            adminId: req.user.adminId,
            habitatId: req.user.habitatId
        });

        res.status(201).json({ message: "Travailleur crée avec succès", travailleur});
    }catch(error){
        res.status(500).json({ message: "Erreur lors de la crèation du Travailleur", error: error.message});
    }
}
export const login = async (req, res) =>{
    try{
        const {username, password} = req.body;
        
        const user = await Travailleur.findOne({ where: { username}});
        if (!user) return res.status(400).json({message: 'Utilisateur introuvable'});

        //Verifier le statut
        if (user.statut === "inactif") {
            return res.status(403).json({ message: "Votre session est desactiver. Contacter votre Admin ou PréAdmin."});
        }

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
export const getAllTravailleurs = async (req, res) => {
  try {
    let travailleurs;

    if (req.user.role === "superadmin") {
      // 🧑‍💼 Le superadmin voit tout
      travailleurs = await Travailleur.findAll();
    } 
    else if (req.user.role === "admin") {
      // 👨‍💼 L’admin voit seulement ses travailleurs
      travailleurs = await Travailleur.findAll({
        where: { adminId: req.user.id }
      });
    } 
    else if (req.user.role === "preadmin") {
      // 👨‍🔧 Le pré-admin voit les travailleurs du même admin que lui
      const preAdmin = await PreAdmin.findByPk(req.user.id);

      if (!preAdmin) {
        return res.status(404).json({ message: "Pré-admin introuvable ❌" });
      }

      travailleurs = await Travailleur.findAll({
        where: { adminId: preAdmin.adminId }
      });
    } 
    else {
      return res.status(403).json({ message: "⛔ Accès interdit" });
    }

    res.json(travailleurs);
  } catch (error) {
    console.error("Erreur getAllTravailleurs:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des travailleurs ❌",
      error: error.message,
    });
  }
};

export const getTravailleurById = async (req, res) => {
  try {
    const travailleur = await Travailleur.findByPk(req.params.id);
    if (!travailleur) {
      return res.status(404).json({ message: "Travailleur introuvable ❌" });
    }

    if (
      req.user.role === "superadmin" ||
      (req.user.role === "admin" && travailleur.adminId === req.user.id) ||
      (req.user.role === "preadmin" && travailleur.preAdminId === req.user.id)
    ) {
      return res.json(travailleur);
    }

    return res.status(403).json({ message: "⛔ Accès interdit" });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération du travailleur ❌",
      error: error.message,
    });
  }
};
export const updateStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    if (!["actif", "inactif"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide (actif/inactif)" });
    }

    const travailleur = await Travailleur.findByPk(id);
    if (!travailleur) return res.status(404).json({ message: "Travailleur introuvable" });

    travailleur.statut = statut;
    await travailleur.save();

    res.json({ message: `Travailleur ${statut} avec succès ✅`, travailleur });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteTravailler = async (req, res) => {
  try {
    const travailler = await Travailleur.findByPk(req.params.id);
    if (!travailler) return res.status(404).json({ message: "❌ Utilisateur introuvable" });

    await travailler.destroy();

    res.json({ message: "✅ Travailler supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur lors de la suppression", error: error.message });
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
