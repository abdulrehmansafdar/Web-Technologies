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

// Get single category by id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!rows.length) return apiError(res, 'Category not found', 404);
    apiSuccess(res, rows[0], 'Category retrieved');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to load category', 500);
  }
});

// Create new category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return apiError(res, 'Category name is required', 400);
    
    const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
    const [newCategory] = await db.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    apiSuccess(res, newCategory[0], 'Category created successfully', null);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return apiError(res, 'Category name already exists', 400);
    }
    apiError(res, 'Failed to create category', 500);
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!name) return apiError(res, 'Category name is required', 400);
    
    const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing.length) return apiError(res, 'Category not found', 404);
    
    await db.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    const [updated] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    apiSuccess(res, updated[0], 'Category updated successfully');
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return apiError(res, 'Category name already exists', 400);
    }
    apiError(res, 'Failed to update category', 500);
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing.length) return apiError(res, 'Category not found', 404);
    
    // Check if category is being used by products
    const [products] = await db.query('SELECT COUNT(*) as count FROM products WHERE category = ?', [existing[0].name]);
    if (products[0].count > 0) {
      return apiError(res, 'Cannot delete category that is being used by products', 400);
    }
    
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    apiSuccess(res, null, 'Category deleted successfully');
  } catch (err) {
    console.error(err);
    apiError(res, 'Failed to delete category', 500);
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