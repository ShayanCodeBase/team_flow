import prisma from "../db/prisma/client";

const connectDatabase = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl?.trim()) {
    console.error(
      "DATABASE_URL is required. PostgreSQL must be configured for Team Flow to start."
    );
    process.exit(1);
  }

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("Connected to PostgreSQL via Prisma");
  } catch (error) {
    console.error("Error connecting to PostgreSQL via Prisma:", error);
    process.exit(1);
  }
};

export default connectDatabase;
