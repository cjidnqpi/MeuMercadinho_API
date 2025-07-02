const { db, saltRounds } = require('../config/globals.cjs');
require('dotenv').config();

exports.getClientProducts = (req, res) => {
    const clientId = req.user?.id;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    if (!clientId || isNaN(clientId)) {
        return res.status(400).json({ error: "ID utilisateur invalide ou non authentifié." });
    }

    const sql = `
        SELECT p.*, oi.quantity AS ordered_quantity, o.id AS order_id, o.order_date, o.order_time
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.client_id = ?
        ORDER BY o.order_date DESC, o.order_time DESC
        LIMIT ? OFFSET ?
    `;

    db.all(sql, [clientId, limit, offset], (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération des produits client :", err);
            return res.status(500).json({ error: "Erreur serveur lors de la récupération des produits." });
        }
        res.json(rows);
    });
};

exports.getDelivery = (req, res) => {
    const clientId = req.user?.id;
    if (!clientId) {
        return res.status(400).json({ error: "Utilisateur non authentifié." });
    }

    const sql = `SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC LIMIT 1`;

    db.get(sql, [clientId], (err, row) => {
        if (err) {
            console.error("Erreur lors de la récupération de la commande :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }
        if (!row) {
            return res.status(404).json({ error: "Aucune commande trouvée." });
        }
        res.json(row);
    });
};

exports.createDelivery = (req, res) => {
    const clientId = req.user?.id;
    const { order_date, order_time } = req.body;

    if (!clientId || !order_date || !order_time) {
        return res.status(400).json({ error: "Paramètres manquants." });
    }

    const checkSql = `SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC LIMIT 1`;

    db.get(checkSql, [clientId], (err, row) => {
        if (err) {
            console.error("Erreur lors de la vérification des commandes :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }
        if (row) {
            return res.status(409).json({ error: "Commande déjà existante." });
        }

        const insertSql = `INSERT INTO orders (client_id, order_date, order_time) VALUES (?, ?, ?)`;
        db.run(insertSql, [clientId, order_date, order_time], function (err) {
            if (err) {
                console.error("Erreur lors de la création de la commande :", err);
                return res.status(500).json({ error: "Erreur serveur." });
            }
            res.status(201).json({ success: true, order_id: this.lastID });
        });
    });
};

// ✅ 3. Ajoute un produit à une commande existante
exports.addProductToKart = (req, res) => {
    const clientId = req.user?.id;
    const { order_id, product_id, quantity } = req.body;

    if (!clientId || !order_id || !product_id || !quantity) {
        return res.status(400).json({ error: "Paramètres manquants." });
    }

    // Vérifie la quantité disponible du produit
    const checkProductSql = `SELECT quantity FROM products WHERE id = ?`;

    db.get(checkProductSql, [product_id], (err, product) => {
        if (err) {
            console.error("Erreur lors de la vérification du produit :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }

        if (!product) {
            return res.status(404).json({ error: "Produit non trouvé." });
        }

        const available = product.quantity;

        if (available < quantity) {
            return res.status(200).json({
                success: false,
                availableQuantity: available
            });
        }

        // Insère l'élément dans la commande
        const insertItemSql = `
            INSERT INTO order_items (order_id, product_id, quantity)
            VALUES (?, ?, ?)
        `;

        db.run(insertItemSql, [order_id, product_id, quantity], function (err) {
            if (err) {
                console.error("Erreur lors de l'ajout du produit à la commande :", err);
                return res.status(500).json({ error: "Erreur serveur." });
            }

            // Met à jour la quantité du produit
            const updateProductSql = `
                UPDATE products SET quantity = quantity - ?
                WHERE id = ?
            `;

            db.run(updateProductSql, [quantity, product_id], function (err2) {
                if (err2) {
                    console.error("Erreur lors de la mise à jour de la quantité du produit :", err2);
                    return res.status(500).json({ error: "Erreur mise à jour quantité." });
                }

                return res.status(200).json({ success: true });
            });
        });
    });
};

exports.deleteProductFromKart = (req, res) => {
    const clientId = req.user?.id;
    const { order_id, product_id } = req.body;

    if (!clientId || !order_id || !product_id) {
        return res.status(400).json({ error: "Paramètres manquants." });
    }

    // Vérifie que la commande appartient bien à ce client
    const checkOrderSql = `SELECT * FROM orders WHERE id = ? AND client_id = ?`;

    db.get(checkOrderSql, [order_id, clientId], (err, order) => {
        if (err) {
            console.error("❌ Erreur lors de la vérification de la commande :", err);
            return res.status(500).json({ error: "Erreur serveur." });
        }

        if (!order) {
            return res.status(403).json({ error: "Commande non trouvée ou non autorisée." });
        }

        // Récupère la quantité commandée
        const getQuantitySql = `SELECT quantity FROM order_items WHERE order_id = ? AND product_id = ?`;

        db.get(getQuantitySql, [order_id, product_id], (err, row) => {
            if (err) {
                console.error("❌ Erreur lors de la récupération de la quantité :", err);
                return res.status(500).json({ error: "Erreur serveur." });
            }

            if (!row) {
                return res.status(404).json({ error: "Produit non trouvé dans la commande." });
            }

            const quantityToRestore = row.quantity;

            // Supprime le produit de la commande
            const deleteSql = `DELETE FROM order_items WHERE order_id = ? AND product_id = ?`;

            db.run(deleteSql, [order_id, product_id], function (err2) {
                if (err2) {
                    console.error("❌ Erreur lors de la suppression du produit :", err2);
                    return res.status(500).json({ error: "Erreur lors de la suppression." });
                }

                // Restaure la quantité dans les stocks
                const restoreStockSql = `UPDATE products SET quantity = quantity + ? WHERE id = ?`;

                db.run(restoreStockSql, [quantityToRestore, product_id], function (err3) {
                    if (err3) {
                        console.error("❌ Erreur lors de la restauration du stock :", err3);
                        return res.status(500).json({ error: "Erreur mise à jour stock." });
                    }

                    return res.status(200).json({ message: "Produit supprimé du panier avec succès." });
                });
            });
        });
    });
};
