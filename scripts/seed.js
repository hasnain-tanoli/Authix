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
    const permissions = [
      { name: "dashboard.read", resource: "dashboard", action: "read", description: "Can view dashboard stats" },
      
      { name: "posts.read", resource: "posts", action: "read", description: "Can read posts" },
      { name: "posts.create", resource: "posts", action: "create", description: "Can create posts" },
      { name: "posts.update", resource: "posts", action: "update", description: "Can update posts" },
      { name: "posts.delete", resource: "posts", action: "delete", description: "Can delete posts" },
      
      { name: "users.read", resource: "users", action: "read", description: "Can read users" },
      { name: "users.create", resource: "users", action: "create", description: "Can create users" },
      { name: "users.update", resource: "users", action: "update", description: "Can update users" },
      { name: "users.delete", resource: "users", action: "delete", description: "Can delete users" },
      
      { name: "roles.read", resource: "roles", action: "read", description: "Can read roles" },
      { name: "roles.create", resource: "roles", action: "create", description: "Can create roles" },
      { name: "roles.update", resource: "roles", action: "update", description: "Can update roles" },
      { name: "roles.delete", resource: "roles", action: "delete", description: "Can delete roles" },
      
      { name: "permissions.read", resource: "permissions", action: "read", description: "Can read permissions" },
      { name: "permissions.create", resource: "permissions", action: "create", description: "Can create permissions" },
      { name: "permissions.update", resource: "permissions", action: "update", description: "Can update permissions" },
      { name: "permissions.delete", resource: "permissions", action: "delete", description: "Can delete permissions" },
    ];

    const createdPerms = [];
    for (const perm of permissions) {
      const [p] = await Permission.findOrCreate({
        where: { name: perm.name },
        defaults: {
          ...perm,
          isSystem: true,
        },
      });
      createdPerms.push(p);
    }

    // Assign ALL permissions to Admin
    await adminRole.setPermissions(createdPerms);
    console.log("Admin role permissions updated (ALL)");

    // Assign Editor permissions (Posts + Dashboard)
    const editorPerms = createdPerms.filter(p => 
      p.name.startsWith("posts.") || p.name === "dashboard.read"
    );
    await editorRole.setPermissions(editorPerms);
    console.log("Editor role permissions updated (Posts + Dashboard)");

    // Assign User permissions (Posts Read only)
    const userPerms = createdPerms.filter(p => p.name === "posts.read");
    await userRole.setPermissions(userPerms);
    console.log("User role permissions updated (posts.read only)");

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
