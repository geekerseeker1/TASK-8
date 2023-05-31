import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mysql from 'mysql';
import expressJwt, { RequestHandler } from 'express-jwt';
import ejs from 'ejs';

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});


const roles = {
  ADMIN: 'admin',
  USER: 'user',
};


const jwtSecret = 'your_secret_key';

interface User {
  username: string;
  password: string;
  role: string;
}


app.post('/register', (req: Request, res: Response) => {
  const { username, password, role } = req.body;


  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      
      const user: User = { username, password: hash, role };
      db.query('INSERT INTO users SET ?', user, (err, result) => {
        if (err) {
          res.status(500).json({ error: 'Internal server error' });
        } else {
          res.status(201).json({ message: 'User registered successfully' });
        }
      });
    }
  });
});


app.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

 
  db.query('SELECT * FROM users WHERE username = ?', username, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error' });
    } else if (results.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
    } else {
      const user: User = results[0];

      
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          res.status(500).json({ error: 'Internal server error' });
        } else if (!isMatch) {
          res.status(401).json({ error: 'Invalid username or password' });
        } else {
          // Generate a JWT token
          const token = jwt.sign(
            { username: user.username, role
