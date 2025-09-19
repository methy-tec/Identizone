
export default (sequelize, DataTypes) => {
    const Famille = sequelize.define("Famille", {
        id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        nom_complet: {type: DataTypes.STRING, allowNull: false, unique: true},
        nombre_personne: {type: DataTypes.STRING, allowNull: false, defaultValue: "0"},
        pereStatut: {
            type: DataTypes.ENUM("vivant", "decede"),
            defaultValue: "vivant",
        },
        mereStatut: {
            type: DataTypes.ENUM("vivant", "decede"),
            defaultValue: "vivant",
        },
        date_deces_pere: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_deces_mere: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    });

    return Famille;
};