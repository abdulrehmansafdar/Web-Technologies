# Assignment # 6

# REST API Development and Consumption

#### Development and Consumption of REST APIs using Node+Express, MySQL, JSON,

#### and jQuery/JavaScript

## 🎯 Objective

#### Develop a complete RESTful API system using Express.js and MySQL, then create a

#### dynamic web interface that consumes these APIs using JavaScript and jQuery. The

#### assignment focuses on understanding full-stack API development from server-side

#### creation to client-side consumption.

## 🛠 Technologies to Implement

## Backend Technologies:

####  Node+Express - Server-side API development

####  MySQL - Database management and data persistence

####  JSON - Data interchange format for API responses

## Frontend Technologies:

####  JavaScript - Client-side API consumption and DOM manipulation

####  jQuery - Simplified AJAX calls and event handling


####  AJAX - Asynchronous API communication

## 📊 Assignment Scope

#### Create a Product Management System with two main components:

#### 1. Backend REST API (Express/MySQL)

#### 2. Frontend Web Interface (JavaScript/jQuery) that consumes the API

## 🗃 Database Schema

```
sql
CREATE DATABASE product_management;
USE product_management;
CREATE TABLE products (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR( 255 ) NOT NULL,
description TEXT,
price DECIMAL( 10 , 2 ) NOT NULL,
category VARCHAR( 100 ),
stock_quantity INT DEFAULT 0 ,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE categories (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR( 100 ) UNIQUE NOT NULL,
description TEXT
);
-- Sample data
```

INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Books', 'Various books and publications'),
('Clothing', 'Apparel and fashion items');
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('Laptop', 'High-performance laptop', 999.99, 'Electronics', 15 ),
('Smartphone', 'Latest smartphone model', 699.99, 'Electronics', 25 ),
('Programming Book', 'Learn web development', 29.99, 'Books', 100 );

## 🔧 Technical Requirements

### Part A: Backend API Development (EXPRESS/MySQL)

#### 1. Product Management Endpoints

#### Base URL: /api/products

#### Method Endpoint Description

#### Request

#### Body

#### Response

#### GET /api/products

#### Get all

#### products

#### -

#### Product list

#### (JSON)

GET (^) /api/products/{id}

#### Get single

#### product

#### -

#### Product object

#### (JSON)

#### POST /api/products

#### Create new

#### product

#### Product data

#### (JSON)

#### Created product

#### (JSON)

PUT (^) /api/products/{id}

#### Update

#### product

#### Product data

#### (JSON)

#### Updated product

#### (JSON)


#### Method Endpoint Description

#### Request

#### Body

#### Response

DELETE (^) /api/products/{id} Delete product -

#### Success message

#### (JSON)

#### 2. Category Management Endpoints

#### Base URL: /api/categories

#### Method Endpoint Description

#### GET /api/categories Get all categories

#### GET /api/categories/{id}/products Get products by category

#### 3. API Response Standards

#### Success Response:

json
{
"status": "success",
"data": {
"id": 1 ,
"name": "Laptop",
"price": 999.99,
"category": "Electronics"
},
"message": "Product retrieved successfully"
}

#### Error Response:

json
{
"status": "error",
"message": "Product not found",
"code": 404


##### }

#### List Response:

```
json
{
"status": "success",
"data": [
{...},
{...}
],
"pagination": {
"total": 25 ,
"page": 1 ,
"per_page": 10
}
}
```
### Part B: Frontend API Consumption (JavaScript/jQuery)

#### 1. Product Management Interface

#### Create a single-page application that performs these operations:

#### CRUD Operations using AJAX:

####  Create : Add new product without page reload

####  Read : Display product list with search/filter

####  Update : Edit product details in modal/form

####  Delete : Remove product with confirmation

#### 2. Required JavaScript/jQuery Functions

#### Fetch and Display Products:

```
javascript
// Using jQuery AJAX
function loadProducts() {
$.ajax({
url: '/api/products',
method: 'GET',
```

dataType: 'json',
success: function(response) {
displayProducts(response.data);
},
error: function(xhr, status, error) {
showError('Failed to load products');
}
});
}

#### Create New Product:

javascript
function createProduct(productData) {
return $.ajax({
url: '/api/products',
method: 'POST',
contentType: 'application/json',
data: JSON.stringify(productData),
success: function(response) {
_// Update UI with new product_
}
});
}

#### Update Product:

javascript
function updateProduct(productId, productData) {
_// Implement PUT request_
}

#### Delete Product:

javascript
function deleteProduct(productId) {
_// Implement DELETE request with confirmation_
}

#### 3. User Interface Requirements

#### Product Listing Page:


####  Display all products in a table/cards

####  Search and filter functionality

####  Sort by price, name, category

####  Pagination or infinite scroll

#### Product Form:

####  Modal or inline form for add/edit operations

####  Real-time validation

####  Success/error notifications

#### Interactive Features:

####  Real-time search with API calls

####  Dynamic form submissions

####  Loading indicators during API calls

####  Error handling and user feedback

## 🎯 Implementation Guidelines

### Backend (Express) Requirements:

####  Use prepared statements for SQL queries

####  Implement proper CORS headers

####  Handle different HTTP methods correctly

####  Validate and sanitize all inputs

####  Return appropriate HTTP status codes

### Frontend (jQuery/JavaScript) Requirements:

####  Use AJAX for all server communications

####  Implement error handling for failed requests

####  Show loading states during API calls

####  Update DOM dynamically based on API responses

####  Handle form submissions asynchronously


## 📋 Deliverables

### 1. Backend API (Express/MySQL)

####  Complete EXPRESS files with all endpoints

####  Database SQL file

####  .htaccess for URL routing (if needed)

### 2. Frontend Interface (HTML/CSS/JavaScript/jQuery)

####  Single HTML file with embedded JavaScript/jQuery

####  CSS for styling

####  Complete API consumption code

### 3. Documentation

####  API endpoint documentation

####  Setup instructions

####  Code comments explaining key functions

### 4. Demo Evidence

####  Postman collection for API testing

####  Screenshots of working interface

####  Video demonstration (optional)

## 🏆 Evaluation Criteria


#### Criteria Weight Description

#### API Functionality 30% All endpoints work correctly

#### API Consumption 25% Frontend properly consumes APIs

#### Error Handling 15% Proper error handling on both sides

#### Code Quality 15% Clean, readable, well-commented code

#### User Experience 10% Smooth, dynamic interface

#### Documentation 5% Clear setup and usage instructions

## 📝 Submission Requirements

#### 1. Source Code organized in folders:

#### o /backend - EXPRESS API files

#### o /frontend - HTML, CSS, JavaScript files

#### o /database - SQL files

#### 2. README.md with:

#### o Installation instructions

#### o API documentation

#### o Usage examples

#### 3. Testing Documentation showing:

#### o API endpoints working in Postman

#### o Frontend functionality screenshots

#### Due Date: 27/11/

## 💡 Learning Outcomes

#### Upon completion, students will be able to:


####  Design and implement RESTful APIs with Express

####  Consume APIs using JavaScript and jQuery

####  Handle asynchronous operations with AJAX

####  Process JSON data on client and server sides

####  Build dynamic web interfaces that interact with backend APIs


