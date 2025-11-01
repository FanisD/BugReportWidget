// db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  password: "2003",
  host: "localhost",
  port: 5432,
  database: "bug_reporter",
});

export default pool;