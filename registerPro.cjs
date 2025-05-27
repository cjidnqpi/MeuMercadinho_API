const express = require('express');
const bcrypt = require('bcrypt');
const { db, saltRounds } = require('./globals.cjs');
const app = express();
const router = express.Router();

app.use(express.json());

// Route POST pour registerPro
router.post('/', (req, res) => {
  const { email, password, name, cnpj, description, type } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: 0, error: err.message });
    if (row) return res.json({ success: 1, message: 'Utilisateur déja existant' });
    db.get('SELECT * FROM waiting_line WHERE email = ?', [email], (err, row) => {
      if (err) return res.status(500).json({ success: 0, error: err.message });
      if (row) return res.json({ success: 2, message: 'Utilisateur en attente de validation' });
      if (type !== 2 && type !== 3) {
        return res.status(400).json({ success: 0, message: 'Type d utilisateur invalide' });
      }
      const stmt = db.prepare("INSERT INTO waiting_line (email, password, name, cnpj, description, type) VALUES (?, ?, ?, ?, ?, ?)");
      const hash = bcrypt.hashSync(password, saltRounds);
      stmt.run(email, hash, name, cnpj, description, type);
      stmt.finalize();
      res.json({ success: 3, message: 'Utilisateur ajouté à la file d attente avec succès' });
    });
  });
});

module.exports = router;
