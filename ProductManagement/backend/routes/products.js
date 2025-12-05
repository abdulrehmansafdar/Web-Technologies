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

// List all products, supports pagination and optional search
router.get('/', async (req, res) => {
  try {
    const { page = 1, per_page = 10, q, category } = req.query;
    const offset = (page - 1) * per_page;

    let where = [];
    let params = [];

    if (q) {
      where.push("(name LIKE ? OR description LIKE ?)");
      const term = `%${q}%`;
      params.push(term, term);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`SELECT SQL_CALC_FOUND_ROWS * FROM products ${whereClause} LIMIT ? OFFSET ?`, [...params, Number(per_page), Number(offset)]);
    const [countRows] = await db.query('SELECT FOUND_ROWS() as total');
    const total = countRows[0].total;

    apiSuccess(res, rows, 'Products retrieved', { total, page: Number(page), per_page: Number(per_page) });
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to load products', 500);
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) return apiError(res, 'Product not found', 404);
    apiSuccess(res, rows[0], 'Product retrieved successfully');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to fetch product', 500);
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, stock_quantity } = req.body;
    if (!name || !price) return apiError(res, 'Name and price are required', 400);

    const [result] = await db.query('INSERT INTO products (name, description, price, category, stock_quantity) VALUES (?, ?, ?, ?, ?)', [
      name,
      description || null,
      Number(price),
      category || null,
      Number(stock_quantity) || 0
    ]);

    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    apiSuccess(res, rows[0], 'Product created successfully');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to create product', 500);
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) return apiError(res, 'Product not found', 404);

    const { name, description, price, category, stock_quantity } = req.body;

    await db.query(
      'UPDATE products SET name = ?, description = ?, price = ?, category = ?, stock_quantity = ? WHERE id = ?',
      [name || rows[0].name, description || rows[0].description, Number(price || rows[0].price), category || rows[0].category, Number(stock_quantity || rows[0].stock_quantity), id]
    );

    const [updated] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    apiSuccess(res, updated[0], 'Product updated successfully');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to update product', 500);
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    if (!rows.length) return apiError(res, 'Product not found', 404);

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    apiSuccess(res, { id }, 'Product deleted successfully');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to delete product', 500);
  }
});

module.exports = router;