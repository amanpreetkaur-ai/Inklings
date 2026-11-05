import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from .env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres.xdwbabrfaopyotkvfxng:inklingsreadandwrite@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres",
  },
});