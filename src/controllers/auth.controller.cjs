const transporter = require('../utils/mailer.cjs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db, saltRounds } = require('../config/globals.cjs');
require('dotenv').config();




exports.login = (req, res) => {
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
};

exports.registerClient = (req, res) => {
  const { email, password, name, cpf } = req.body;
  db.get('SELECT * FROM waiting_line WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (row) return res.json({ success: false, message: 'Utilisateur Pro en attente de validation' });
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
};

exports.registerPro = (req, res) => {
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
};


exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requis' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // expire dans 10 min

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) return res.status(500).json({ message: 'Erreur DB' });
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        db.run(`INSERT INTO verification_codes (user_mail, code, expires_at) VALUES (?, ?, ?)`,
            [email, code, expiresAt], (err) => {
                if (err) return res.status(500).json({ message: 'Erreur DB' });

                // Envoi du mail
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Code de réinitialisation MeuMercadinho',
                    text: `Voici votre code de réinitialisation : ${code}\nIl expire dans 10 minutes.`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Erreur d\'envoi de mail :', error);
                        return res.status(500).json({ message: 'Erreur d\'envoi de mail', error: error.message });
                    }
                    res.status(200).json({ message: 'Code envoyé' });
                });
            });
    });
};

exports.resetPassword = (req, res) => {
    const { code , password } = req.body;

    if (!password) return res.status(400).json({ message: 'Password required' });
    if (!code) return res.status(400).json({ message: 'Code required' });

    db.get("SELECT * FROM verification_codes WHERE code = ?", [code], (err, user) => {
        if (err) return res.status(500).json({ message: 'Erreur DB' });
        if (!user) return res.status(404).json({ message: 'Incorrect code' });
        if (new Date(user.expires_at) < new Date()) {
            db.run("DELETE FROM verification_codes WHERE code = ?", [code], (err) => {
                if (err) return res.status(500).json({ message: 'Erreur DB' });
            });
            return res.status(400).json({ message: 'Code expired' });
        }
        db.run("DELETE FROM verification_codes WHERE code = ?", [code], (err) => {
            if (err) return res.status(500).json({ message: 'Erreur DB' });
        
            const hash = bcrypt.hashSync(password, saltRounds);
            db.run("UPDATE users SET password = ? WHERE email = ?", [hash, user.user_mail], (err) => {
                if (err) return res.status(500).json({ message: 'Erreur DB' });
                res.status(200).json({ message: 'Password updated' });
            });
    });

    });
};
