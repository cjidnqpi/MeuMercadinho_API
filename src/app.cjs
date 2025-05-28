const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes.cjs');
const routesApp = require('./routes/app.routes.cjs');
require('dotenv').config();

app.use(express.json());
app.use('/api', routesApp);
app.use('/api/auth', authRoutes);

module.exports = app;
