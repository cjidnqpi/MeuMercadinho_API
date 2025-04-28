const loginRouter = require('./login.cjs');
const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;

// Appel du fichier d'initialisation
require('./init-db.cjs');

// Utilisation du router pour la route /login
app.use('/login', loginRouter);

// Routes et autres configurations
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API');
});

app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
