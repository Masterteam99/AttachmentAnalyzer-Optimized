import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

// Determina il dialect dal DATABASE_URL
const isPostgreSQL = process.env.DATABASE_URL.startsWith('postgresql://');
const isSQLite = process.env.DATABASE_URL.startsWith('file:');

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: isPostgreSQL ? "postgresql" : "sqlite",
  dbCredentials: isPostgreSQL ? {
    url: process.env.DATABASE_URL,
  } : {
    url: process.env.DATABASE_URL,
  },
});
