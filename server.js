const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const PORT = process.env.PORT ;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
  {
    host: 'localhost',
    // MySQL username,
    user: process.env.USER,
    // MySQL password
    password: process.env.PASS,
    database: process.env.DATABASE
  },
  console.log(`Connected to the books_db database.`)
);