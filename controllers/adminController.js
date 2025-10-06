import { Admin, Habitat } from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import moment from "moment";
import { where } from "sequelize";

export const register = async (req, res) =>{
    try{
        const {username, nom_complet, lieu_naissance, date_naissance, numero_tel, adresse, camp, password, habitatId} = req.body;
        const photo = req.file? req.file.filename : null;

        const hashedPassword = await bcrypt.hash(password, 10);


        //Conversion de la date au format ISO pour Sequelize
        const isoDate = moment(date_naissance, "DD/MM/YYYY").format("YYYY-MM-DD");

        // 1 Cree L'admin sans habitatId
        const admin = await Admin.create({username, nom_complet, lieu_naissance, camp, date_naissance: isoDate, numero_tel, adresse, photo, password: hashedPassword, });

        // 2 Cree automatiquement son Habitat lié
        const habitat = await Habitat.create({ nom: camp, adminId: admin.id});

        await admin.update({ habitatId: habitat.id});

        res.status(201).json({message: "Admin et Habitat crées avec succes", admin, habitat});
    }catch(error){
        res.status(500).json({ message: "Erreur lors de la creation de l'admin", error: error.message,});
    }
};

export const login = async (req, res) =>{
    try{
        const {username, password} = req.body;
        
        const user = await Admin.findOne({ where: { username}});
        if (!user) return res.status(400).json({message: 'Utilisateur introuvable'});

        const hashedPassword = await bcrypt.hash(password, 10);

        const valid = await bcrypt.compare(password, hashedPassword);
        if (!valid) return res.status(400).json({ message: 'Mot de passse incorrect'});

        const token = jwt.sign({ id: user.id, role: user.role, habitatId: user.habitatId,}, process.env.JWT_SECRET, {expiresIn: '1h'});
        const refreshToken = jwt.sign({ id: user.id, role: user.role}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "2h"});
        
        res.json({token, refreshToken, user: {id: user.id, nom_complet: user.nom_complet, username: user.username, habitatId: user.habitatId, role: user.role}});

    }catch (err){
        res.status(500).json({ message: err.message})
    }
}
export const getAllAdmins = async (req, res) => {
    try{
        const user = await Admin.findAll({
            attributes:[
                "id",
                "username",
                "nom_complet",
                "lieu_naissance",
                "date_naissance",
                "numero_tel",
                "adresse",
                "photo",
                "camp",
                "role",
                "createdAt"
            ],
            include: [
                {
                    model: Habitat,
                    as: "Habitat",
                    attributes: ["id", "nom"],
                },
            ],
        });
        res.json(user);
    }catch(error){
        res.status(500).json({ message: "Erreur lors de la récupération des Admins ❌", error: error.message });
    }
}
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, nom_complet, date_naissance, password, numero_tel, adresse } = req.body;

    // Chercher l'admin
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin non trouvé ❌" });
    }

    // Si une nouvelle photo a été envoyée
    if (req.file) {
      // Supprimer l’ancienne photo de Cloudinary si elle existe
      if (admin.photo) {
        // admin.photo contient normalement le "public_id" de Cloudinary
        await cloudinary.uploader.destroy(admin.photo);
      }

      // Uploader la nouvelle photo sur Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "admins", // dossier Cloudinary
      });

      // Sauvegarder le public_id (pratique pour suppression plus tard)
      admin.photo = result.public_id;
    }

    // Mettre à jour les autres champs
    admin.username = username || admin.username;
    admin.nom_complet = nom_complet || admin.nom_complet;
    admin.date_naissance = date_naissance || admin.date_naissance;
    admin.password = password || admin.password;
    admin.numero_tel = numero_tel || admin.numero_tel;
    admin.adresse = adresse || admin.adresse;

    await admin.save();

    return res.json({
      message: "✅ Admin mis à jour avec succès",
      admin,
      photoUrl: admin.photo ? cloudinary.url(admin.photo) : null,
    });
  } catch (error) {
    console.error("Erreur updateAdmin:", error);
    return res.status(500).json({ message: "❌ Erreur serveur", error: error.message });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id, {
      include: [
        {
          model: Habitat,
          as: "Habitat", // ⚡ bien utiliser l’alias défini dans tes associations
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({ message: "❌ Admin introuvable" });
    }

    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({
      message: "❌ Erreur lors de la récupération de l'admin",
      error: error.message,
    });
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
