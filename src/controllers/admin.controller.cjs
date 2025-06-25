const { db, saltRounds } = require('../config/globals.cjs');
require('dotenv').config();

exports.getUsers = (req, res) => {
    // Vérifie que l'utilisateur est bien de type 0 (admin)
    if (!req.user || req.user.type !== 0) {
        return res.status(403).json({ message: 'Accès refusé : droits insuffisants.' });
    }

    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const query = 'SELECT id, email, created_at, name, type, profile_picture FROM users ORDER BY id LIMIT ? OFFSET ?';
    
    db.all(query, [limit, offset], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs :', err);
            return res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
        res.status(200).json(rows);
    });
}
exports.changeType = (req, res) => {
    if (!req.user || req.user.type !== 0) {
        return res.status(403).json({ message: 'Accès refusé : droits insuffisants.' });
    }

    const { id, type } = req.body;

    if (typeof id !== 'number' || typeof type !== 'number') {
        return res.status(400).json({ message: 'Paramètres invalides.' });
    }

    const query = 'UPDATE users SET type = ? WHERE id = ?';
    db.run(query, [type, id], function(err) {
        if (err) {
            console.error('Erreur lors de la modification du type utilisateur :', err);
            return res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.status(200).json({ message: 'Type de compte modifié avec succès.' });
    });
}

exports.getWaitingUsers = (req, res) => {
    // Vérifie que l'utilisateur est bien de type 0 (admin)
    if (!req.user || req.user.type !== 0) {
        return res.status(403).json({ message: 'Accès refusé : droits insuffisants.' });
    }

    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const query = 'SELECT id, email, created_at, name, type, description FROM waiting_line ORDER BY id LIMIT ? OFFSET ?';
    
    db.all(query, [limit, offset], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs :', err);
            return res.status(500).json({ message: 'Erreur interne du serveur.' });
        }
        res.status(200).json(rows);
    });
}

exports.waitingUserDecision = (req, res) => {
    if (!req.user || req.user.type !== 0) {
        return res.status(403).json({ message: 'Accès refusé : droits insuffisants.' });
    }

    const { id, decision } = req.body;

    if (typeof id !== 'number' || (decision !== 'accept' && decision !== 'reject')) {
        return res.status(400).json({ message: 'Paramètres invalides.' });
    }

    if (decision === 'accept') {
        // Accepter : transférer puis supprimer
        db.run(
            `INSERT INTO users (email, password, name, type, cpf)
             SELECT email, password, name, type, cnpj FROM waiting_line WHERE id = ?`,
            [id],
            function(err) {
                if (err) {
                    console.error('Erreur lors de l’acceptation :', err);
                    return res.status(500).json({ message: 'Erreur interne du serveur.' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Utilisateur non trouvé.' });
                }
                // Suppression après insertion
                db.run(`DELETE FROM waiting_line WHERE id = ?`, [id], function(err) {
                    if (err) {
                        console.error('Erreur lors de la suppression après acceptation :', err);
                        return res.status(500).json({ message: 'Erreur interne lors du nettoyage.' });
                    }
                    res.status(200).json({ message: 'Utilisateur accepté et supprimé de la waiting line.' });
                });
            }
        );
    } else {
        // Rejet : suppression simple
        db.run(`DELETE FROM waiting_line WHERE id = ?`, [id], function(err) {
            if (err) {
                console.error('Erreur lors du rejet :', err);
                return res.status(500).json({ message: 'Erreur interne du serveur.' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }
            res.status(200).json({ message: 'Utilisateur rejeté et supprimé de la waiting line.' });
        });
    }
};
