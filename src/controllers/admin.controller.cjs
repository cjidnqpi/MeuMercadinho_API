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

exports.deleteProductAdmin = (req, res) => {
    const userId = req.user.id;
    const userType = req.user.type; // on suppose que le type est dans req.user.type
    const productId = parseInt(req.query.productId);

    if (isNaN(productId)) {
        return res.status(400).json({ error: "Paramètre 'productId' invalide." });
    }

    // Requête différente selon type utilisateur
    const query = userType === 0
        ? `SELECT * FROM products WHERE id = ?`           // admin : n'importe quel produit
        : `SELECT * FROM products WHERE id = ? AND artisan_id = ?`;  // artisan : seulement ses produits

    const params = userType === 0 ? [productId] : [productId, userId];

    db.get(query, params, (err, product) => {
        if (err) {
            console.error("Erreur lors de la recherche du produit :", err);
            return res.status(500).json({ error: "Erreur serveur" });
        }
        if (!product) {
            return res.status(404).json({ error: "Produit non trouvé ou non autorisé." });
        }

        // Supprimer le fichier image associé si présent
        if (product.photo_url) {
            const imagePath = path.join(__dirname, "../../", product.photo_url);
            fs.unlink(imagePath, (fsErr) => {
                if (fsErr && fsErr.code !== 'ENOENT') {
                    console.error("Erreur lors de la suppression de l'image :", fsErr);
                }
            });
        }

        // Suppression du produit
        const deleteQuery = userType === 1
            ? `DELETE FROM products WHERE id = ?`
            : `DELETE FROM products WHERE id = ? AND artisan_id = ?`;

        const deleteParams = userType === 1 ? [productId] : [productId, userId];

        db.run(deleteQuery, deleteParams, function (dbErr) {
            if (dbErr) {
                console.error("Erreur lors de la suppression du produit :", dbErr);
                return res.status(500).json({ error: "Erreur lors de la suppression du produit" });
            }
            res.json({ message: "Produit supprimé avec succès." });
        });
    });
};

