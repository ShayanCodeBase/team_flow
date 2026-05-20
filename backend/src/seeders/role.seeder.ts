import "dotenv/config";
import { WorkspaceRoleName } from "@prisma/client";
import prisma from "../db/prisma/client";
import { RolePermissions } from "../utils/role-permission";

const seedRoles = async () => {
  console.log("Seeding roles into PostgreSQL...");

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required to seed roles.");
    process.exit(1);
  }

  try {
    await prisma.$connect();

    for (const roleName of Object.keys(RolePermissions) as WorkspaceRoleName[]) {
      const permissions =
        RolePermissions[roleName as keyof typeof RolePermissions];

      await prisma.role.upsert({
        where: { name: roleName },
        create: { name: roleName, permissions },
        update: { permissions },
      });

      console.log(`Role ${roleName} upserted.`);
    }

    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seedRoles().catch((error) =>
  console.error("Error running seed script:", error)
);
