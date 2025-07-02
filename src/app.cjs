const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes.cjs');
const routesApp = require('./routes/app.routes.cjs');
const adminRoutes = require('./routes/admin.routes.cjs');
const accountRoutes = require('./routes/account.routes.cjs');
const artisanRoutes = require('./routes/artisan.routes.cjs');
const customersRoutes = require('./routes/customers.routes.cjs');
const path = require('path');
require('dotenv').config();

app.use(express.json());
app.use('/api', routesApp);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/artisan', artisanRoutes);
app.use('/api/customers', customersRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

module.exports = app;
