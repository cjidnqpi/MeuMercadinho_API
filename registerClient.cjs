const express = require('express');
const bcrypt = require('bcrypt');
const { db, saltRounds } = require('./globals.cjs');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();

app.use(express.json());

// Route POST pour registerClient
router.post('/', (req, res) => {
  const { email, password, name, cpf } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (row) return res.json({ success: false, message: 'Utilisateur déja existant' });
    const stmt = db.prepare("INSERT INTO users (email, password, name, cpf) VALUES (?, ?, ?, ?)");
    const hash = bcrypt.hashSync(password, saltRounds);
    stmt.run(email, hash, name, cpf);
    stmt.finalize();
    res.json({ success: true, message: 'Utilisateur enregistré avec succès' });
  });
});

module.exports = router;
