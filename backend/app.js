const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes.js');
const { connectDB } = require('./config/database');
const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');
const passport = require('passport');
const cookieParser = require('cookie-parser'); // Import cookie-parser

dotenv.config();

const app = express();
const port = 3001;


app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize passport
app.use(passport.initialize());

// Cookie parser middleware
app.use(cookieParser());



const staticFilesPath = path.join(__dirname, '../frontend/views');
app.use(express.static(staticFilesPath));
console.log(staticFilesPath);

const publicPath = path.join(__dirname, '../frontend/public');
app.use(express.static(publicPath));

app.use('/models', express.static(path.join(staticFilesPath, 'models')));
app.use('/controller', express.static(path.join(staticFilesPath, 'controller')));


// API Routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);


app.get('/', (req, res) => {
    res.redirect('/auth.html');
});

app.get('/index.html', (req, res) => {
  const token = req.cookies.token;


  if (!token) {
    return res.redirect('/auth.html'); // Redirect to login page
  }

 
  res.sendFile(path.join(staticFilesPath, 'index.html'));

});


app.get('/test', (req, res) => {
  res.status(200).json({ status: 'success' });
});


async function testConnection() {
  try {
    const dbConfig = {
      server: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: 1433,
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    };
    const pool = new sql.ConnectionPool(dbConfig);
    await pool.connect();
    console.log('✅ Database connection test: Success!');
  } catch (error) {
    console.error('❌ Database connection test: Failed!', error);
  }
}

testConnection();

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});