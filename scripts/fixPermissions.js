import dotenv from "dotenv";
import { connectDB, Permission } from "../db/connection.js";
import { Op } from "sequelize";

dotenv.config();

const fixPermissions = async () => {
  const dbName = process.env.DB_NAME;
  const dbUsername = process.env.DB_USERNAME;
  const dbPassword = process.env.DB_PASSWORD;
  const dbHost = process.env.DB_HOST;

  await connectDB(dbName, dbUsername, dbPassword, dbHost);

  try {
    const result = await Permission.update(
      { isSystem: false },
      {
        where: {
          [Op.or]: [{ resource: "posts" }, { name: { [Op.like]: "%post%" } }],
        },
      }
    );

    console.log(`Updated ${result[0]} permissions to isSystem: false`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating permissions:", error);
    process.exit(1);
  }
};

fixPermissions();
