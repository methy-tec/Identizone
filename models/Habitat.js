export default (sequelize, DataTypes) => {
    const Habitat = sequelize.define("Habitat", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        nom: {type: DataTypes.STRING, allowNull: false},
    });
    return Habitat;
}