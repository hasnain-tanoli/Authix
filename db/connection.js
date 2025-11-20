import { Sequelize } from "sequelize";
import createUserModel from "../models/userModel.js";

let User;

export const connectDB = async (database, username, password, host) => {
  if (User) return;

  const isLocal = host === "localhost" || host === "127.0.0.1";

  const sequelize = new Sequelize(database, username, password, {
    host: host || "localhost",
    dialect: "postgres",
    dialectOptions: {
      ssl: isLocal
        ? false
        : {
            require: true,
            rejectUnauthorized: false,
          },
    },
    logging: false,
  });

  try {
    await sequelize.authenticate();
    User = await createUserModel(sequelize);
    await sequelize.sync({ alter: true });
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export { User };
