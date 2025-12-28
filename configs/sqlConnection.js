import 'dotenv/config';
import { Pool } from "pg";

// Normalize connection string scheme and create pool
const rawUrl = process.env.POSTGRESQL_CONNECTION_URL || "";
const connectionString = rawUrl.startsWith("postgresql://")
    ? rawUrl.replace("postgresql://", "postgres://")
    : rawUrl;

const pool = new Pool({ connectionString });

export default pool;