const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const { connectDB } = require('./config/database');
const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/test', (req, res) => {
  res.status(200).json({ status: 'success' });
});

// Test the database connection
async function testConnection() {
    try {
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
        const pool = new sql.ConnectionPool(dbConfig);
         await pool.connect(dbConfig); // connect to database
        console.log('✅ Database connection test: Success!');
    } catch (error) {
        console.error('❌ Database connection test: Failed!', error);
    }
}

testConnection();

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});