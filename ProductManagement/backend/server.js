const express = require('express');
const cors = require('cors');
const bodyParser = require('express').json;
const routesProducts = require('./routes/products');
const routesCategories = require('./routes/categories');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser());

// API routes
app.use('/api/products', routesProducts);
app.use('/api/categories', routesCategories);

app.get('/', (req, res) => res.json({ status: 'success', message: 'Product Management API running' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
