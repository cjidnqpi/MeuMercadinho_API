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
    const artisan_id = req.user.id;

    if (!artisan_id || !name || quantity == null || price == null) {
      return res.status(400).json({ error: "Champs obligatoires manquants : 'name', 'quantity', 'price'" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "L'image du produit (PNG) est requise" });
    }

    const photo_url = `/uploads/${req.file.filename}`;

    const query = `
      INSERT INTO products (artisan_id, name, quantity, price, photo_url, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [artisan_id, name, quantity, price, photo_url, description || null];

    db.run(query, params, function (dbErr) {
      if (dbErr) {
        console.error("Erreur base de données :", dbErr);
        return res.status(500).json({ error: "Erreur lors de l'ajout du produit" });
      }

      res.status(201).json({
        message: "Produit ajouté avec succès",
        product_id: this.lastID,
        photo_url
      });
    });
  });
};

