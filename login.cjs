const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
const { db, saltRounds } = require('./globals.cjs');

app.use(express.json());

// Route POST pour login
router.post('/', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.json({ success: false, message: 'Utilisateur non trouvé' });
    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        console.error('Erreur lors de la comparaison :', err);
        return;
      }

    if (result) {
      const token = jwt.sign(
        { id: row.id, type: row.type },
        process.env.JWT_SECRET,
        { expiresIn: '31d' }
      );
      res.json({ success: true, message: 'Connexion réussie', token: token });
    } else {
      res.json({ success: false, message: 'Mot de passe incorrect' });
    }
      });
  });
});

module.exports = router;
