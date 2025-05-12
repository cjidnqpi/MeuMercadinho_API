// forgot-password.cjs
const express = require('express');
const { db } = require('./globals.cjs');
const nodemailer = require('nodemailer');
const router = express.Router();

// Transporter email (à configurer avec ton app password sécurisé)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'naoresponder.meumercadinho@gmail.com',
        pass: 'lnnw rnzh jjwv oirf' // NE PAS push ça en public
    }
});

router.post('/', (req, res) => {
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
                    from: 'ton.email@gmail.com',
                    to: email,
                    subject: 'Code de réinitialisation MeuMercadinho',
                    text: `Voici votre code de réinitialisation : ${code}\nIl expire dans 10 minutes.`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return res.status(500).json({ message: 'Erreur d\'envoi de mail' });
                    }
                    res.status(200).json({ message: 'Code envoyé' });
                });
            });
    });
});

module.exports = router;
