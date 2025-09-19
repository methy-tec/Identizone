
export default (sequelize, DataTypes) => {
    const PreAdmin = sequelize.define("PreAdmin", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        username: {type: DataTypes.STRING, allowNull: false, unique:true},
        password: {type: DataTypes.STRING},
        nom_complet: {type: DataTypes.STRING, allowNull: false, unique: true},
        lieu_naissance: {type: DataTypes.STRING},
        date_naissance: {type: DataTypes.DATEONLY},
        numero_tel: {type: DataTypes.STRING, allowNull: false,},
        adresse: {type: DataTypes.STRING, allowNull: false,},
        photo: {type: DataTypes.STRING},
        role: {type: DataTypes.STRING, defaultValue: "preadmin"},
        
    });

    return PreAdmin;
};