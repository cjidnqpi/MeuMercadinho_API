const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { hash } = require('crypto');
const path = require('path');
const saltRounds = 10;
// Chemin vers la base de données
const dbPath = path.join(__dirname, 'database.db');



// Crée ou ouvre la base de données SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erreur lors de l'ouverture de la base de données", err);
        return;
    }
    console.log('Base de données ouverte');
});

// Initialisation de la base de données
db.serialize(() => {
    // Création d'une table (si elle n'existe pas)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            name TEXT NOT NULL,
            type INTEGER NOT NULL DEFAULT 1,
            cpf TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT,
            postal_code TEXT
        )
    `);

    // Insertion de données par défaut si la table est vide
    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
        if (err) {
            console.error("Erreur lors de la vérification des utilisateurs", err);
            return;
        }
        if (row.count === 0) {
            console.log("Aucun utilisateur trouvé, insertion de l'utilisateur par défaut");
            const stmt = db.prepare("INSERT INTO users (email, password, type, name) VALUES (?, ?, ?, ?)");
            const hash = bcrypt.hashSync("admin123", saltRounds);
            stmt.run("admin@admin.com", hash, 0, "Admin");
            stmt.finalize();
        }
    });
});

