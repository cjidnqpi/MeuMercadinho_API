// forgot-password.cjs
const express = require('express');
const { db , saltRounds } = require('./globals.cjs');
const bcrypt = require('bcrypt');
const router = express.Router();


router.post('/', (req, res) => {
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
});

module.exports = router;
