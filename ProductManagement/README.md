# Product Management System (Assignment 6)

This project implements a RESTful API using Node.js + Express and MySQL, plus a frontend interface using HTML/CSS/JavaScript (jQuery) that consumes the API using AJAX.

> NOTE: This is an example implementation intended to help you understand the steps and verify your assignment requirements. Personalize the code, comments, and README to match your own work before submission.

---

## Project Structure

- `/backend` - Express server, API endpoints, database connection.
- `/frontend` - Single-page application (index.html) and static assets.
- `/database` - SQL schema and sample data.

---

## Quick Setup

1. Clone or copy the repository.
2. Create `.env` in `/backend` using `.env.example` and fill in DB credentials.
3. Run the SQL in `/database/schema.sql` to create the `product_management` DB and sample data.

Install dependencies and start the backend using Bun (recommended):

```bash
cd backend
bun install
bun run start
```
Or with NPM (if you have Node.js installed and prefer npm):

```bash
cd backend
npm install
npm run dev # or npm start
```

Open `/frontend/index.html` in a browser. (If CORS or file-access issues occur, serve the frontend with a simple server or in the same origin as the backend.)

For example using a simple local HTTP server to serve `frontend`:

```bash
# from project root
python3 -m http.server 8000 --directory frontend
# Then open http://localhost:8000 in your browser
```

---

## Docker Compose (Recommended)

This repository includes a `docker-compose.yml` that runs MySQL, the backend, and the frontend containers together. It exposes:
- frontend: http://localhost:8080
- backend API: http://localhost:3000/api

Quick steps to run the whole stack using Docker:

```bash
cd <project-root>
docker compose up --build
```

Stop the stack:

```bash
docker compose down
```

Notes:
- The backend will wait for the database to be ready before starting the API server.
- Frontend is served by a small nginx server on port 8080 and calls the backend at `http://localhost:3000/api`.

---

### Installing Bun (optional)

To run the project locally with Bun, install Bun by following the instructions on the official site: https://bun.sh/

For example (Linux):

```bash
curl -fsSL https://bun.sh/install | bash
```

After installing, ensure that `bun` is in your PATH by restarting your terminal or running `source ~/.bashrc` (or shell equivalent).

---

## API Endpoints

Base URL: `/api` (default server port `3000`)

Products
- GET `/api/products` - List all products. Query params: `page`, `per_page`, `q` (search), `category`.
- GET `/api/products/:id` - Get single product by id.
- POST `/api/products` - Create new product.
- PUT `/api/products/:id` - Update existing product.
- DELETE `/api/products/:id` - Delete product.

Categories
- GET `/api/categories` - List categories.
- GET `/api/categories/:id/products` - Get products for a category.

All responses follow the JSON structure:

Success example:
```
{ "status": "success", "data": {...}, "message": "Product retrieved successfully" }
```
Error example:
```
{ "status": "error", "message": "Product not found", "code": 404 }
```

---

## Notes & Requirements Covered

- Prepared statements used in `db.query` calls (via mysql2 package) to prevent SQL injection.
- CORS is enabled in `server.js`.
- Input validation occurs in the API (basic required checks) — expand as needed.
- Frontend uses jQuery AJAX and updates the DOM dynamically.
- Pagination, search, filtering, and basic CRUD operations are implemented.

---

## Demo & Testing

- Use the provided SQL to seed sample data and then start backend.
- Open the frontend and try creating, editing, deleting products.
- The repository includes minimal UI for searching and pagination.

---

## Personalization Checklist ✅

Before submitting this as your own:
1. Update comments and commit messages to reflect your work.
2. Add additional explanation in README for which parts you implemented or modified.
3. Add screenshots and Postman collection exported from your testing.
4. Expand input validation and error-handling as needed to demonstrate your understanding.

---

## Author

Your Name (e.g., Abdul Rehman)

---
