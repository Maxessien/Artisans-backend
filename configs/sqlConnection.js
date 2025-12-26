import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.POSTGRESQL_CONNECTION_URL
})


export default pool