import { Utilisateur,Admin, PreAdmin, Habitat, Famille } from "../models/index.js";
import moment from "moment";

export const registerUtilisateur = async (req, res) => {
  try {
    const {
      nom,
      postnom,
      prenom,
      lieu_naissance,
      date_naissance,
      sexe,
      niveau_etude,
      numero_tel,
      adresse,
      nationalite,
      etat_civil,
      profession,
      familleId,
    } = req.body;

    console.log("Data reçue:", req.body);


    // 1️⃣ Vérifier si la famille existe
    const famille = await Famille.findByPk(familleId, {
      include: [{ model: Utilisateur, as: "membres" }],
    });
    if (!famille) {
      return res.status(404).json({ message: "❌ Famille introuvable" });
    }

    // 2️⃣ Formater la date au format ISO pour Sequelize
    const isoDate = moment(date_naissance, "YYYY-MM-DD").format("YYYY-MM-DD");
    const photo = req.file ? req.file.filename : null;

    // 3️⃣ Empêcher la création d’un doublon
    const doublon = await Utilisateur.findOne({
      where: { nom, postnom, prenom, date_naissance: isoDate, familleId },
    });

    if (doublon) {
      return res
        .status(400)
        .json({ message: "❌ Cet utilisateur existe déjà dans cette famille" });
    }

    // 4️⃣ Créer l’utilisateur
    const utilisateur = await Utilisateur.create({
      nom,
      postnom,
      prenom,
      lieu_naissance,
      date_naissance: isoDate,
      sexe,
      nationalite,
      niveau_etude,
      etat_civil,
      numero_tel,
      adresse,
      photo,
      familleId,
      profession,
      adminId: req.user?.adminId || null,
      habitatId: req.user?.habitatId || null,
    });

    // 5️⃣ Mise à jour automatique de la famille
    if (sexe === "M" && !famille.pereId) {
      await famille.update({ pereId: utilisateur.id });
    } else if (sexe === "F" && !famille.mereId) {
      await famille.update({ mereId: utilisateur.id });
    }

    // 6️⃣ Réponse finale
    res.status(201).json({
      message: "✅ Utilisateur créé avec succès",
      utilisateur,
    });
  } catch (error) {
    console.error("Erreur registerUtilisateur:", error);
    res.status(500).json({
      message: "❌ Erreur lors de la création de l'utilisateur",
      error: error.message,
    });
  }
};

// ➡️ Marquer un utilisateur comme décédé
export const declarerDeces = async (req, res) => {
  try {
    const { date_deces } = req.body;
    const utilisateur = await Utilisateur.findByPk(req.params.id);

    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur introuvable ❌" });
    }

    await utilisateur.update({
      statut: "decede",
      date_deces: date_deces || new Date(),
    });

    res.json({
      message: "Utilisateur marqué comme décédé ✅",
      utilisateur,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la mise à jour du décès ❌",
      error: error.message,
    });
  }
};
export const updateUtilisateur = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) return res.status(404).json({ message: "❌ Utilisateur introuvable" });

    const {
      nom, postnom, prenom, lieu_naissance,
      date_naissance, sexe, niveau_etude, numero_tel,
      adresse, nationalite, etat_civil, profession
    } = req.body;

    const isoDate = date_naissance
  ? moment(date_naissance, ["DD/MM/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")
  : utilisateur.date_naissance;

    const photo = req.file ? req.file.filename : utilisateur.photo;

    await utilisateur.update({
      nom: nom || utilisateur.nom,
      postnom: postnom || utilisateur.postnom,
      prenom: prenom || utilisateur.prenom,
      lieu_naissance: lieu_naissance || utilisateur.lieu_naissance,
      date_naissance: isoDate,
      sexe: sexe || utilisateur.sexe,
      nationalite: nationalite || utilisateur.nationalite,
      niveau_etude: niveau_etude || utilisateur.niveau_etude,
      etat_civil: etat_civil || utilisateur.etat_civil,
      numero_tel: numero_tel || utilisateur.numero_tel,
      adresse: adresse || utilisateur.adresse,
      profession: profession || utilisateur.profession,
      photo
    });

    res.json({ message: "✅ Utilisateur modifié avec succès", utilisateur });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur lors de la modification", error: error.message });
  }
};

export const deleteUtilisateur = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) return res.status(404).json({ message: "❌ Utilisateur introuvable" });

    await utilisateur.destroy();

    // 🔄 Mettre à jour nombre_personnes dans Famille
    const famille = await Famille.findByPk(utilisateur.familleId);
    if (famille) {
      const count = await Utilisateur.count({ where: { familleId: famille.id } });
      await famille.update({ nombre_personnes: count });
    }

    res.json({ message: "✅ Utilisateur supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "❌ Erreur lors de la suppression", error: error.message });
  }
};
// 📋 Récupérer utilisateurs selon rôle
export const getUtilisateurs = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Non autorisé ❌" });

    let whereClause = {};

    if (req.user.role === "superadmin") {
      // Superadmin → voir tous les utilisateurs
      whereClause = {};
    } else if (req.user.role === "admin") {
      // Admin → voir ses utilisateurs
      whereClause = { adminId: req.user.id };
    } else if (req.user.role === "preadmin") {
      // PréAdmin → utilisateurs liés à son habitat
      whereClause = { habitatId: req.user.habitatId };
    } else {
      return res.status(403).json({ message: "Accès refusé ❌" });
    }

    const utilisateurs = await Utilisateur.findAll({
      where: whereClause,
      include: [
        { model: Admin, attributes: ["id", "nom_complet"] },
        { model: Habitat, attributes: ["id", "nom"] },
        { model: Famille, as: "famille", attributes: ["id", "nom_complet"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(utilisateurs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs ❌", error: error.message });
  }
};
