import { Pool } from "pg"

const pool = new Pool({
    connectionString: process.env.POSTGRESQL_CONNECTION_URL
})


(async()=>{
    try {
        await pool.query("SELECT 1")
    } catch (err) {
        console.log("Error connecting to postgresql", err)
        process.kill()
    }
})()

export default pool