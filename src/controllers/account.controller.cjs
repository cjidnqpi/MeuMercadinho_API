const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db, saltRounds } = require('../config/globals.cjs');
require('dotenv').config();

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

const upload = multer({ storage }).single("profileImage");

exports.setProfilePicture = (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erreur lors de l'upload" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const id  = req.user.id;

    if (!id) {
      return res.status(400).json({ error: "ID utilisateur requis" });
    }

    db.run("UPDATE users SET profile_picture = ? WHERE id = ?", [imageUrl, id], function (dbErr) {
      if (dbErr) {
        console.error(dbErr);
        return res.status(500).json({ error: "Erreur lors de la mise à jour dans la base de données" });
      }

      res.json({ message: "Image de profil mise à jour", imageUrl });
    });
  });
};

exports.updateAccount = (req, res) => {
    const { name, email, cpf, phone } = req.body;
    const id = req.user.id;
    
    if (!id) {
        return res.status(400).json({ error: "ID utilisateur requis" });
    }
    
    if (!name || !email) {
        return res.status(400).json({ error: "Nom et email requis" });
    }
    
    db.run("UPDATE users SET name = ?, email = ?, cpf = ?, phone = ? WHERE id = ?", [name, email, cpf,phone, id], function (err) {
        if (err) {
        console.error(err);
        return res.status(500).json({ error: "Erreur lors de la mise à jour du compte" });
        }
    
        if (this.changes === 0) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
    
        res.json({ message: "Compte mis à jour avec succès" });
    });
};

exports.getProducts = (req, res) => {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    db.all(
        `SELECT products.*, users.name AS artisan_name 
         FROM products 
         JOIN users ON products.artisan_id = users.id 
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
            if (err) {
                console.error("Erreur lors de la récupération des produits :", err);
                return res.status(500).json({ error: 'Erreur serveur' });
            }
            res.json(rows);
        }
    );
}
