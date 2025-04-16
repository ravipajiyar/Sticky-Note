// config/database.js
const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 1433, //Add this so it connects to it
  options: {
    encrypt: false, // Set to true in production if using Azure
    trustServerCertificate: true // set to false to check server certificate
  }
};

async function connectDB() {
  try {
    const pool = new sql.ConnectionPool(dbConfig);
    await pool.connect(); // connect to database
    console.log('Database connected sucessfully');
    return pool;
  } catch (err) {
    console.log('database error',err)
    throw err
  }
}

module.exports = { connectDB };