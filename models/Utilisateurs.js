
export default (sequelize, DataTypes) => {
    const Utilisateurs = sequelize.define("Utilisateurs", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        nom: {type: DataTypes.STRING, allowNull: false},
        postnom: {type: DataTypes.STRING, allowNull: false},
        prenom: {type: DataTypes.STRING, allowNull: false},
        lieu_naissance: {type: DataTypes.STRING},
        date_naissance: {type: DataTypes.DATEONLY},
        sexe: {type: DataTypes.ENUM("M", "F"), allowNull: false},
        nationalite: {type: DataTypes.STRING},
        profession: {type: DataTypes.STRING},
        etat_civil: {type: DataTypes.STRING},
        niveau_etude: {type: DataTypes.STRING},
        numero_tel: {type: DataTypes.STRING, allowNull: false,},
        adresse: {type: DataTypes.STRING, allowNull: false,},
        photo: {type: DataTypes.STRING},
        statut: {
            type: DataTypes.ENUM("vivant", "decede"),
            defaultValue: "vivant",
        },
        date_deces: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        }
    });
    
    return Utilisateurs;
};