
export default (sequelize, DataTypes) => {
    const Admin = sequelize.define("Admin", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        username: {type: DataTypes.STRING, allowNull: false, unique:true},
        password: {type: DataTypes.STRING},
        role: {type: DataTypes.STRING, defaultValue: "admin"},
        nom_complet: {type: DataTypes.STRING, allowNull: false, unique: true},
        lieu_naissance: {type: DataTypes.STRING},
        date_naissance: {type: DataTypes.DATEONLY},
        numero_tel: {type: DataTypes.STRING, allowNull: false,},
        adresse: {type: DataTypes.STRING, allowNull: false,},
        photo: {type: DataTypes.STRING},
        camp: {type: DataTypes.STRING, allowNull: false},
    });

    return Admin;
};