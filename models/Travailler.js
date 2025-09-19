
export default (sequelize, DataTypes) => {
    const Travailler = sequelize.define("Travailler", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        username: {type: DataTypes.STRING, allowNull: false, unique:true},
        password: {type: DataTypes.STRING},
        role: {type: DataTypes.STRING, defaultValue: "travailler"},
        nom_complet: {type: DataTypes.STRING, allowNull: false, unique: true},
        lieu_naissance: {type: DataTypes.STRING},
        date_naissance: {type: DataTypes.DATEONLY},
        numero_tel: {type: DataTypes.STRING, allowNull: false,},
        adresse: {type: DataTypes.STRING, allowNull: false,},
        photo: {type: DataTypes.STRING},
        statut:{
            type: DataTypes.ENUM("inactif", "actif"),
            defaultValue: "inactif",
        }
    });

    return Travailler;
};