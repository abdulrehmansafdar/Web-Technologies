const express = require('express');
const router = express.Router();
const db = require('../db');

function apiSuccess(res, data, message = 'Success', pagination) {
  const payload = { status: 'success', data, message };
  if (pagination) payload.pagination = pagination;
  return res.json(payload);
}

function apiError(res, message, statusCode = 400) {
  return res.status(statusCode).json({ status: 'error', message, code: statusCode });
}

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories');
    apiSuccess(res, rows, 'Categories retrieved');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to load categories', 500);
  }
});

// Get products by category id
router.get('/:id/products', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [categoryRows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!categoryRows.length) return apiError(res, 'Category not found', 404);
    const categoryName = categoryRows[0].name;
    const [products] = await db.query('SELECT * FROM products WHERE category = ?', [categoryName]);
    apiSuccess(res, products, 'Products for category retrieved');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to fetch products', 500);
  }
});

module.exports = router;