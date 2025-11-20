import dotenv from "dotenv";
import { connectDB, User, Role } from "../db/connection.js";
import bcrypt from "bcrypt";

dotenv.config();

const seedDatabase = async () => {
  const dbName = process.env.DB_NAME;
  const dbUsername = process.env.DB_USERNAME;
  const dbPassword = process.env.DB_PASSWORD;
  const dbHost = process.env.DB_HOST;

  await connectDB(dbName, dbUsername, dbPassword, dbHost);

  try {
    const [adminRole] = await Role.findOrCreate({
      where: { name: "admin" },
      defaults: { description: "Administrator with full access", level: 100 },
    });

    const [editorRole] = await Role.findOrCreate({
      where: { name: "editor" },
      defaults: { description: "Can create and edit content", level: 50 },
    });

    await Role.findOrCreate({
      where: { name: "user" },
      defaults: { description: "Standard user", level: 10 },
    });

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const [adminUser, created] = await User.findOrCreate({
      where: { email: "admin@authix.com" },
      defaults: {
        username: "admin",
        name: "System Administrator",
        password: hashedPassword,
        isSystem: true,
      },
    });

    if (created || adminUser) {
      await adminUser.addRole(adminRole);
      await adminUser.addRole(editorRole);
      console.log("Admin user created/updated with roles.");
    }

    console.log("Database seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
