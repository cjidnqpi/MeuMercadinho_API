const { db, saltRounds } = require('../config/globals.cjs');
require('dotenv').config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

const uploadProductImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png') {
      return cb(new Error("Seuls les fichiers PNG sont autorisés."));
    }
    cb(null, true);
  }
}).single("productImage");

exports.addProduct = (req, res) => {
  uploadProductImage(req, res, function (err) {
    if (err) {
      console.error("Erreur d'upload :", err);
      return res.status(400).json({ error: err.message || "Erreur lors de l'upload de l'image" });
    }

    const { name, quantity, price, description } = req.body;

    const parsedQuantity = parseInt(quantity, 10);
    const parsedPrice = parseFloat(price);
    const artisan_id = req.user?.id;

    // Vérification des champs obligatoires
    if (!artisan_id || !name || isNaN(parsedQuantity) || isNaN(parsedPrice)) {
      return res.status(400).json({
        error: "Champs obligatoires manquants ou invalides : 'name', 'quantity' (entier), 'price' (nombre), 'artisan_id'."
      });
    }

    // Vérification de l'image
    if (!req.file) {
      return res.status(400).json({ error: "L'image du produit (format PNG) est requise." });
    }

    const photo_url = `/uploads/${req.file.filename}`;

    const query = `
      INSERT INTO products (artisan_id, name, quantity, price, photo_url, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      artisan_id,
      name.trim(),
      parsedQuantity,
      parsedPrice,
      photo_url,
      description?.trim() || null
    ];

    db.run(query, params, function (dbErr) {
      if (dbErr) {
        console.error("Erreur base de données :", dbErr);
        return res.status(500).json({ error: "Erreur lors de l'ajout du produit à la base de données." });
      }

      res.status(201).json({
        message: "Produit ajouté avec succès.",
        product_id: this.lastID,
        photo_url
      });
    });
  });
};


exports.getProductsArtisan = (req, res) => {
    const artisanId = req.user.id;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    if (isNaN(artisanId)) {
        return res.status(400).json({ error: "L'en-tête 'artisan-id' est requis et doit être un entier." });
    }

    db.all(
        `SELECT products.*, users.name AS artisan_name 
         FROM products 
         JOIN users ON products.artisan_id = users.id 
         WHERE products.artisan_id = ?
         LIMIT ? OFFSET ?`,
        [artisanId, limit, offset],
        (err, rows) => {
            if (err) {
                console.error("Erreur lors de la récupération des produits :", err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json(rows);
        }
    );
};

exports.deleteProduct = (req, res) => {
    const artisanId = req.user.id;
    const productId = parseInt(req.query.productId);

    if (isNaN(productId)) {
        return res.status(400).json({ error: "Paramètre 'productId' invalide." });
    }

    db.get(
        `SELECT * FROM products WHERE id = ? AND artisan_id = ?`,
        [productId, artisanId],
        (err, product) => {
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

            db.run(
                `DELETE FROM products WHERE id = ? AND artisan_id = ?`,
                [productId, artisanId],
                function (dbErr) {
                    if (dbErr) {
                        console.error("Erreur lors de la suppression du produit :", dbErr);
                        return res.status(500).json({ error: "Erreur lors de la suppression du produit" });
                    }
                    res.json({ message: "Produit supprimé avec succès." });
                }
            );
        }
    );
};

exports.getArtisanProductsInOrders = (req, res) => {
    const artisanId = req.user?.id;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    if (!artisanId || isNaN(artisanId)) {
        return res.status(400).json({ error: "ID artisan invalide ou non authentifié." });
    }

    const sql = `
        SELECT p.*, oi.quantity AS ordered_quantity, o.id AS order_id, o.client_id, o.order_date, o.order_time
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE p.artisan_id = ?
        ORDER BY o.order_date DESC, o.order_time DESC
        LIMIT ? OFFSET ?
    `;

    db.all(sql, [artisanId, limit, offset], (err, rows) => {
        if (err) {
            console.error("Erreur lors de la récupération des produits artisan commandés :", err);
            return res.status(500).json({ error: "Erreur serveur lors de la récupération des produits." });
        }
        res.json(rows);
    });
};