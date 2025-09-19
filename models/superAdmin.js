export default (sequelize, DataTypes) => {
  const SuperAdmin = sequelize.define("SuperAdmin", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    nom_complet: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    numero_tel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adresse: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {type: DataTypes.STRING, defaultValue: "superadmin"},

  });

  return SuperAdmin;
};
