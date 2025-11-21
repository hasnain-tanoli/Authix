import dotenv from "dotenv";
import { connectDB, User, Role, Permission } from "../db/connection.js";
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
      defaults: {
        description: "Administrator with full access",
        level: 100,
        isSystem: true,
      },
    });

    const [editorRole] = await Role.findOrCreate({
      where: { name: "editor" },
      defaults: {
        description: "Can create and edit content",
        level: 50,
        isSystem: false,
      },
    });

    // Update existing editor role to be non-system
    if (editorRole.isSystem) {
      editorRole.isSystem = false;
      await editorRole.save();
      console.log("Editor role updated to isSystem: false");
    }

    const [userRole] = await Role.findOrCreate({
      where: { name: "user" },
      defaults: { description: "Standard user", level: 10, isSystem: true },
    });

    // Create Permissions
    const [readPostsPerm] = await Permission.findOrCreate({
      where: { name: "posts.read" },
      defaults: {
        action: "read",
        resource: "posts",
        description: "Can read posts",
        isSystem: true,
      },
    });

    // Assign only posts.read to user role
    await userRole.setPermissions([readPostsPerm]);
    console.log("User role permissions updated to only posts.read");

    const systemEmail = "system@authix.com";
    const systemUsername = "system";
    const plainPassword = "admin123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    let systemUser = await User.findOne({ where: { email: systemEmail } });

    if (systemUser) {
      systemUser.password = hashedPassword;
      systemUser.isSystem = true;
      systemUser.username = systemUsername;
      await systemUser.save();
      console.log(`Existing user '${systemEmail}' updated with new password.`);
    } else {
      systemUser = await User.create({
        email: systemEmail,
        username: systemUsername,
        name: "System Administrator",
        password: hashedPassword,
        isSystem: true,
      });
      console.log(`New user '${systemEmail}' created.`);
    }

    // 3. Assign Roles
    await systemUser.addRole(adminRole);
    await systemUser.addRole(editorRole);
    console.log("Roles assigned to System Admin.");

    console.log("--------------------------------");
    console.log("LOGIN DETAILS:");
    console.log(`Email:    ${systemEmail}`);
    console.log(`Username: ${systemUsername}`);
    console.log(`Password: ${plainPassword}`);
    console.log("--------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
