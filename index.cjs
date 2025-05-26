const loginRouter = require('./login.cjs');
const registerClientRouter = require('./registerClient.cjs');
const forgotPasswordRouter = require('./forgot-password.cjs');
const resetPasswordRouter = require('./reset-password.cjs');
const registerProRouter = require('./registerPro.cjs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const { db, saltRounds } = require('./globals.cjs');
app.use(express.json());
const port = 3000;


// Appel du fichier d'initialisation
const initDB = require('./init-db.cjs');

// Utilisation du router pour la route /login
app.use('/login', loginRouter);

// Utilisation du router pour la route /registerClient
app.use('/registerClient', registerClientRouter);

// Utilisation du router pour la route /registerPro
app.use('/registerPro', registerProRouter);

// Utilisation du router pour la route /forgot-password
app.use('/forgot-password', forgotPasswordRouter);

// Utilisation du router pour la route /reset-password
app.use('/reset-password', resetPasswordRouter);




// Routes et autres configurations
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API');
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
