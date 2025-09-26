import { Op } from "sequelize";
import {Famille, Utilisateur} from "../models/index.js";

export const createFamille = async (req, res) => {
  try {
    const { nom_complet } = req.body;
    if (!nom_complet) return res.status(400).json({message: "Veuillez fournir le nom complet ❌"})

    const familles = await Famille.create({
      nom_complet,
      nombre_personne: 0,
      adminId: req.user.adminId,
      habitatId: req.user.habitatId,
    });

    res.status(201).json({
      message: "Famille créé avec succès ✅",
      familles,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Erreur lors de la création du Famille ❌",
      error: error.message,
    });
  }
};
// controllers/familleController.js
export const updateStatutParent = async (req, res) => {
  try {
    const { id } = req.params; // id de la famille
    const { parent, statut, date_deces } = req.body;

    const famille = await Famille.findByPk(id);
    if (!famille) return res.status(404).json({ message: "Famille introuvable ❌" });

    if (parent === "pere") {
      famille.pereStatut = statut;
      famille.date_deces_pere = statut === "decede" ? date_deces : null;
    } else if (parent === "mere") {
      famille.mereStatut = statut;
      famille.date_deces_mere = statut === "decede" ? date_deces : null;
    } else {
      return res.status(400).json({ message: "Parent invalide (pere ou mere)" });
    }

    await famille.save();
    res.json({ message: "Statut mis à jour ✅", famille });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur ❌", error: error.message });
  }
};
// 🔎 Récupérer les familles avec père ou mère décédé
// 🔎 Récupérer les familles avec père ou mère décédé
export const getFamillesWithParentsDecedes = async (req, res) => {
  try {
    const familles = await Famille.findAll({
      include: [
        {
          model: Utilisateur,
          as: "pere",
          attributes: ["id", "nom", "postnom", "prenom", "sexe", "statut", "date_deces"],
          where: { statut: "decede" },
          required: false
        },
        {
          model: Utilisateur,
          as: "mere",
          attributes: ["id", "nom", "postnom", "prenom", "sexe", "statut", "date_deces"],
          where: { statut: "decede" },
          required: false
        }
      ]
    });

    // Filtrer manuellement pour garder seulement les familles où au moins un parent est décédé
    const famillesFiltrees = familles.filter(
      f => f.pere !== null || f.mere !== null
    );

    res.status(200).json(famillesFiltrees);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des familles avec parents décédés ❌",
      error: error.message,
    });
  }
};
// 📋 Lister les familles selon le rôle
export const getFamillesByUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non autorisé ❌" });
    }

    let whereClause = {};

    if (req.user.role === "admin") {
      // 🔗 Admin → familles créées par lui
      whereClause = { adminId: req.user.id };
    } else if (req.user.role === "preadmin") {
      // 🔗 PréAdmin → familles liées à son habitat
      whereClause = { habitatId: req.user.habitatId };
    } else {
      return res.status(403).json({ message: "Accès refusé ❌" });
    }

    const familles = await Famille.findAll({
      where: whereClause,
      include: [
        { model: Utilisateur, as: "pere", attributes: ["id", "nom", "postnom", "prenom", "statut", "date_deces"] },
        { model: Utilisateur, as: "mere", attributes: ["id", "nom", "postnom", "prenom", "statut", "date_deces"] },
      ],
    });

    res.json(familles);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des familles ❌",
      error: error.message,
    });
  }
};

export const updateFamille = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_complet, pereId, mereId } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Non autorisé ❌" });
    }

    // Vérifier si la famille existe
    const famille = await Famille.findByPk(id);
    if (!famille) {
      return res.status(404).json({ message: "Famille introuvable ❌" });
    }

    // Vérifier droits d’accès
    if (req.user.role === "admin" && famille.adminId !== req.user.id) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos familles ❌" });
    }
    if (req.user.role === "preadmin" && famille.habitatId !== req.user.habitatId) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que les familles de votre habitat ❌" });
    }

    // Mise à jour
    await famille.update({
      nom_complet: nom_complet || famille.nom_complet,
      pereId: pereId || famille.pereId,
      mereId: mereId || famille.mereId,
    });

    res.json({ message: "Famille modifiée avec succès ✅", famille });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la modification de la famille ❌",
      error: error.message,
    });
  }
};
export const deleteFamille = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: "Non autorisé ❌" });
    }

    // Vérifier si la famille existe
    const famille = await Famille.findByPk(id);
    if (!famille) {
      return res.status(404).json({ message: "Famille introuvable ❌" });
    }

    // Vérifier droits d’accès
    if (req.user.role === "admin" && famille.adminId !== req.user.id) {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos familles ❌" });
    }
    if (req.user.role === "preadmin" && famille.habitatId !== req.user.habitatId) {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que les familles de votre habitat ❌" });
    }

    // Supprimer les utilisateurs liés à la famille
    await Utilisateur.destroy({ where: { familleId: id } });

    // Supprimer la famille
    await famille.destroy();

    res.json({ message: "Famille et utilisateurs associés supprimés avec succès ✅" });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la suppression de la famille ❌",
      error: error.message,
    });
  }
};

/**
 * 📋 Lister TOUTES les familles (SuperAdmin)
 */
export const getAllFamilles = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Accès refusé ❌" });
    }

    const familles = await Famille.findAll({
      include: [
        { model: Utilisateur, as: "pere", attributes: ["id", "nom", "postnom", "prenom", "statut", "date_deces"] },
        { model: Utilisateur, as: "mere", attributes: ["id", "nom", "postnom", "prenom", "statut", "date_deces"] },
      ],
    });

    res.json(familles);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération de toutes les familles ❌",
      error: error.message,
    });
  }
};


