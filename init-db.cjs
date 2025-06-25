const bcrypt = require('bcryptjs');
const { db, saltRounds } = require('./src/config/globals.cjs');

// Générateurs de données
function generateEmail(index) {
    return `user${index}@example.com`;
}
function generateName(index) {
    return `User ${index}`;
}
function generateCNPJ(index) {
    return `00.000.000/${index.toString().padStart(4, '0')}-00`;
}
function generateDescription(index) {
    const descriptions = [
        "Entreprise innovante spécialisée dans le développement durable et les technologies propres. Elle travaille sur des solutions vertes pour un avenir plus respectueux de l'environnement et de la planète.",
        "Startup dynamique offrant des services de livraison par drones autonomes. Axée sur la rapidité, la précision et la réduction de l'empreinte carbone dans les zones urbaines.",
        "Société créative de marketing digital qui aide les marques à se connecter avec leur audience à travers des campagnes percutantes, visuelles et centrées sur l'expérience utilisateur.",
        "Coopérative agricole moderne visant à améliorer la productivité des petits producteurs à l’aide d’outils technologiques adaptés aux réalités locales du Brésil.",
        "Plateforme éducative qui propose des cours en ligne interactifs pour les étudiants brésiliens, avec une approche pédagogique innovante et adaptée aux nouvelles générations.",
        "Entreprise de cybersécurité fournissant des solutions de protection des données pour PME. Elle mise sur l’accessibilité, l’automatisation et la prévention proactive des risques informatiques.",
        "ONG technologique qui développe des applications pour soutenir les populations vulnérables : accès à l’eau, à l’éducation, et à des services de santé mobile.",
        "Société de conseil en innovation numérique pour les entreprises traditionnelles qui souhaitent accélérer leur transformation digitale et rester compétitives sur le marché international.",
        "Start-up spécialisée en intelligence artificielle dans le domaine de la santé, avec des solutions pour le diagnostic précoce et l'analyse automatisée des examens médicaux.",
        "Entreprise familiale qui modernise la vente directe de produits artisanaux à travers une application mobile dédiée aux petits producteurs locaux et aux consommateurs urbains.",
    ];
    return descriptions[index % descriptions.length]; // Cycle sur 10 descriptions
}

// Initialisation de la base de données
db.serialize(() => {
    // Création des tables
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

    // Insertion utilisateurs
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
                const type = i === 1 ? 0 : 1;
                stmt.run(email, hash, type, name);
            }
            stmt.finalize();
        }
    });

    // Insertion waiting line
    db.get("SELECT COUNT(*) AS count FROM waiting_line", (err, row) => {
        if (err) {
            console.error("Erreur lors de la vérification de la waiting line", err);
            return;
        }
        if (row.count === 0) {
            console.log("Insertion de 30 utilisateurs dans la waiting line...");
            const stmt = db.prepare("INSERT INTO waiting_line (email, password, name, type, cnpj, description) VALUES (?, ?, ?, ?, ?, ?)");
            for (let i = 1; i <= 30; i++) {
                const email = `waiting${i}@example.com`;
                const name = `Entreprise ${i}`;
                const password = bcrypt.hashSync(`waitingpass${i}`, saltRounds);
                const type = 1;
                const cnpj = generateCNPJ(i);
                const description = generateDescription(i);
                stmt.run(email, password, name, type, cnpj, description);
            }
            stmt.finalize();
        }
    });
    console.log("Base de données initialisée avec succès");
});
