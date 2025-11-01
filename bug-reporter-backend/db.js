// db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "",
  password: "",
  host: "",
  port: "",
  database: "",
});

export default pool;