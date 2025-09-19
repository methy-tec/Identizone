import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "mysql",
  dialectOptions:{
    ssl:{
      require:true,
      rejectUnauthorized: false,
    }
  },
  logging: false,
});

export default sequelize;