const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Constantes globales
const saltRounds = 10;

// Connexion base de données
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erreur d'ouverture de la base :", err.message);
    } else {
        console.log("Base de données ouverte");
    }
});

module.exports = { db, saltRounds };
