const bcrypt = require('bcryptjs');
const { db, saltRounds } = require('./src/config/globals.cjs');



function generateEmail(index) {
    return `user${index}@example.com`;
}
function generateName(index) {
    return `User ${index}`;
}


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
                postal_code TEXT,
                profile_picture TEXT
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_mail TEXT NOT NULL,

            code TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_mail) REFERENCES users(email)
            )
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS waiting_line (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                name TEXT NOT NULL,
                type INTEGER NOT NULL DEFAULT 1,
                cnpj TEXT,
                description TEXT
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
                for (let i = 1; i <= 30; i++) {
                    const email = generateEmail(i);
                    const name = generateName(i);
                    const hash = bcrypt.hashSync(`password${i}`, saltRounds);
                    const type = i === 1 ? 0 : 1; // Par exemple, le premier est admin, les autres utilisateurs classiques
                stmt.run(email, hash, type, name);
                }
                stmt.finalize();
            }
        });
    });
