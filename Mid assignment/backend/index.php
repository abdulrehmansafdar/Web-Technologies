<?php
require_once 'config.php';

// Get the request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Parse the path
$path = parse_url($path, PHP_URL_PATH);
$path = str_replace('/index.php', '', $path);

// Route the request
try {
    $db = getDBConnection();
    
    // Parse request body for POST, PUT requests
    $input = null;
    if (in_array($method, ['POST', 'PUT'])) {
        $input = json_decode(file_get_contents('php://input'), true);
    }
    
    // Extract ID from path if present
    $pathParts = explode('/', trim($path, '/'));
    // Remove empty elements
    $pathParts = array_filter($pathParts);
    $pathParts = array_values($pathParts);
    $id = isset($pathParts[0]) && is_numeric($pathParts[0]) ? (int)$pathParts[0] : null;
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single employee
                getEmployee($db, $id);
            } else {
                // Get all employees with pagination
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                getAllEmployees($db, $page, $limit);
            }
            break;
            
        case 'POST':
            createEmployee($db, $input);
            break;
            
        case 'PUT':
            updateEmployee($db, $id, $input);
            break;
            
        case 'DELETE':
            deleteEmployee($db, $id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// Function to get all employees with pagination
function getAllEmployees($db, $page = 1, $limit = 10) {
    $offset = ($page - 1) * $limit;
    
    // Get total count
    $countStmt = $db->query("SELECT COUNT(*) as total FROM employees");
    $total = $countStmt->fetch()['total'];
    
    // Get employees
    $stmt = $db->prepare("SELECT * FROM employees ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $employees = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $employees,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

// Function to get a single employee
function getEmployee($db, $id) {
    $stmt = $db->prepare("SELECT * FROM employees WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $employee = $stmt->fetch();
    
    if ($employee) {
        echo json_encode(['success' => true, 'data' => $employee]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Employee not found']);
    }
}

// Function to create a new employee
function createEmployee($db, $input) {
    if (!$input || !isset($input['name'], $input['email'], $input['position'], $input['salary'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    // Validate email
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    try {
        $stmt = $db->prepare("INSERT INTO employees (name, email, position, salary) VALUES (:name, :email, :position, :salary)");
        $stmt->execute([
            'name' => $input['name'],
            'email' => $input['email'],
            'position' => $input['position'],
            'salary' => $input['salary']
        ]);
        
        $newId = $db->lastInsertId();
        $stmt = $db->prepare("SELECT * FROM employees WHERE id = :id");
        $stmt->execute(['id' => $newId]);
        $employee = $stmt->fetch();
        
        http_response_code(201);
        echo json_encode(['success' => true, 'message' => 'Employee created successfully', 'data' => $employee]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
        } else {
            throw $e;
        }
    }
}

// Function to update an employee
function updateEmployee($db, $id, $input) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Employee ID is required']);
        return;
    }
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'No data provided']);
        return;
    }
    
    // Validate email if provided
    if (isset($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    // Build update query dynamically
    $fields = [];
    $params = ['id' => $id];
    
    foreach (['name', 'email', 'position', 'salary'] as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = :$field";
            $params[$field] = $input[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        return;
    }
    
    try {
        $sql = "UPDATE employees SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() > 0) {
            $stmt = $db->prepare("SELECT * FROM employees WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $employee = $stmt->fetch();
            
            echo json_encode(['success' => true, 'message' => 'Employee updated successfully', 'data' => $employee]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Employee not found or no changes made']);
        }
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
        } else {
            throw $e;
        }
    }
}

// Function to delete an employee
function deleteEmployee($db, $id) {
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Employee ID is required']);
        return;
    }
    
    $stmt = $db->prepare("DELETE FROM employees WHERE id = :id");
    $stmt->execute(['id' => $id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Employee deleted successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Employee not found']);
    }
}
