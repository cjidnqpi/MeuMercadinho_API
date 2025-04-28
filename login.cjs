const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();

app.use(express.json());

// Connexion à SQLite
const db = new sqlite3.Database('./database.db');

// Route POST pour login (exemple)
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
      res.json({ success: true, message: 'Connexion réussie' });
    } else {
      res.json({ success: false, message: 'Mot de passe incorrect' });
    }
      });
  });
});

module.exports = router;
