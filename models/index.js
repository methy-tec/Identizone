import { DataTypes, where } from "sequelize";
import sequelize from "../config/database.js";

import AdminFactory from "./Admin.js";
import PreAdminFactory from "./PreAdmin.js";
import TravailleurFactory from "./Travailler.js";
import FamilleFactory from "./Famille.js";
import UtilisateurFactory from "./Utilisateurs.js";
import HabitatFactory from "./Habitat.js";
import SuperAdminFactory from "./superAdmin.js";

const Admin = AdminFactory(sequelize, DataTypes);
const PreAdmin = PreAdminFactory(sequelize, DataTypes);
const Travailleur = TravailleurFactory(sequelize, DataTypes);
const Famille = FamilleFactory(sequelize, DataTypes);
const Utilisateur = UtilisateurFactory(sequelize, DataTypes);
const Habitat = HabitatFactory(sequelize, DataTypes);
const SuperAdmin = SuperAdminFactory(sequelize, DataTypes);

// 🔗 Associations

// Admin → PreAdmin / Travailleur / Famille / Utilisateur
Admin.hasMany(PreAdmin, { foreignKey: "adminId" });
PreAdmin.belongsTo(Admin, { foreignKey: "adminId" });

Admin.hasMany(Travailleur, { foreignKey: "adminId" });
Travailleur.belongsTo(Admin, { foreignKey: "adminId" });

Admin.hasMany(Famille, { foreignKey: "adminId" });
Famille.belongsTo(Admin, { foreignKey: "adminId" });

Admin.hasMany(Utilisateur, { foreignKey: "adminId" });
Utilisateur.belongsTo(Admin, { foreignKey: "adminId" });

// 1 Admin - 1 Habitat
Admin.hasOne(Habitat, {foreignKey: "adminId", onDelete: "CASCADE"});
Habitat.belongsTo(Admin, {foreignKey: "adminId"});

//1 Habitat - 1 Admin/ Travailleru/ Famille/ Utilisateur/ PreAdmin
Habitat.hasOne(Admin, {foreignKey: "habitatId", onDelete: "CASCADE"});
Admin.belongsTo(Habitat, {foreignKey: "habitatId"});

Habitat.hasOne(PreAdmin, {foreignKey: "habitatId", onDelete: "CASCADE"});
PreAdmin.belongsTo(Habitat, {foreignKey: "habitatId"});

Habitat.hasOne(Travailleur, {foreignKey: "habitatId", onDelete: "CASCADE"});
Travailleur.belongsTo(Habitat, {foreignKey: "habitatId"});

Habitat.hasOne(Utilisateur, {foreignKey: "habitatId", onDelete: "CASCADE"});
Utilisateur.belongsTo(Habitat, {foreignKey: "habitatId"});

Habitat.hasOne(Famille, {foreignKey: "habitatId", onDelete: "CASCADE"});
Famille.belongsTo(Habitat, {foreignKey: "habitatId"});

// PreAdmin → Travailleur
PreAdmin.hasMany(Travailleur, { foreignKey: "preAdminId" });
Travailleur.belongsTo(PreAdmin, { foreignKey: "preAdminId" });

// Famille → Utilisateur/
Famille.hasMany(Utilisateur, { foreignKey: "familleId", as: "membres" });
Utilisateur.belongsTo(Famille, { foreignKey: "familleId", as: "famille" });

Famille.belongsTo(Utilisateur, {foreignKey: "pereId", as: "pere"});

Famille.belongsTo(Utilisateur, { foreignKey: "mereId", as: "mere"});

//Hook pour mettre à jour nombre_personne
Utilisateur.addHook("afterCreate", async (utilisateur) => {
    if (utilisateur.familleId) {
        const count = await Utilisateur.count({where: {familleId: utilisateur.familleId}});
        await Famille.update({nombre_personne: count}, {where: {id: utilisateur.familleId}});
    }
});

Utilisateur.addHook("afterDestroy", async (utilisateur) => {
    if (utilisateur.familleId) {
        const count = await Utilisateur.count({where: {familleId: utilisateur.familleId}});
        await Famille.update({nombre_personne: count}, {where: {id: utilisateur.familleId}});
    }
});

export { sequelize, Admin, SuperAdmin, PreAdmin, Travailleur, Famille, Utilisateur, Habitat };
