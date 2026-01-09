import { Pool } from '@neondatabase/serverless';

// Conexão serverless-friendly
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default pool;