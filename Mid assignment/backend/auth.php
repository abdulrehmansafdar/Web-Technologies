<?php
require_once 'config.php';

// Get bearer token from header
function getBearerToken() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

// Authenticate user from token
function authenticate($db) {
    $token = getBearerToken();
    
    if (!$token) {
        return null;
    }
    
    $stmt = $db->prepare("
        SELECT u.*, e.name as employee_name, e.email, e.position
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN employees e ON u.employee_id = e.id
        WHERE s.token = :token AND s.expires_at > NOW() AND u.is_active = TRUE
    ");
    $stmt->execute(['token' => $token]);
    
    return $stmt->fetch();
}

// Only run routing logic if this file is accessed directly
if (basename($_SERVER['SCRIPT_FILENAME']) === 'auth.php') {
    // Enable CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    // Get request method
    $method = $_SERVER['REQUEST_METHOD'];
    $requestUri = $_SERVER['REQUEST_URI'];

    // Parse the action from the URL
    // URL format: /auth/login or /auth/logout etc.
    $path = parse_url($requestUri, PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));

    // Find 'auth' in the path and get the next part as action
    $action = null;
    for ($i = 0; $i < count($pathParts); $i++) {
        if ($pathParts[$i] === 'auth' && isset($pathParts[$i + 1])) {
            $action = $pathParts[$i + 1];
            break;
        }
    }

    try {
        $db = getDBConnection();
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($action) {
            case 'login':
                handleLogin($db, $input);
                break;
                
            case 'logout':
                handleLogout();
                break;
                
            case 'verify':
                handleVerify($db);
                break;
                
            case 'change-password':
                handleChangePassword($db, $input);
                break;
                
            default:
                http_response_code(404);
                echo json_encode(['error' => 'Endpoint not found']);
                break;
        }
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Login handler
function handleLogin($db, $input) {
    if (!isset($input['username'], $input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT u.*, e.name as employee_name, e.email, e.position 
        FROM users u
        LEFT JOIN employees e ON u.employee_id = e.id
        WHERE u.username = :username AND u.is_active = TRUE
    ");
    $stmt->execute(['username' => $input['username']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($input['password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        return;
    }
    
    // Generate session token (simple implementation - use JWT in production)
    $token = bin2hex(random_bytes(32));
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+8 hours'));
    
    // Store session in database
    $stmt = $db->prepare("
        CREATE TABLE IF NOT EXISTS sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    $stmt->execute();
    
    $stmt = $db->prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)");
    $stmt->execute([
        'user_id' => $user['id'],
        'token' => $token,
        'expires_at' => $tokenExpiry
    ]);
    
    // Remove password from response
    unset($user['password']);
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'user' => $user,
            'token' => $token,
            'expires_at' => $tokenExpiry
        ]
    ]);
}

// Logout handler
function handleLogout() {
    $token = getBearerToken();
    
    if ($token) {
        $db = getDBConnection();
        $stmt = $db->prepare("DELETE FROM sessions WHERE token = :token");
        $stmt->execute(['token' => $token]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
}

// Verify token
function handleVerify($db) {
    $user = authenticate($db);
    
    if ($user) {
        unset($user['password']);
        echo json_encode(['success' => true, 'data' => $user]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
    }
}

// Change password
function handleChangePassword($db, $input) {
    $user = authenticate($db);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }
    
    if (!isset($input['current_password'], $input['new_password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Current password and new password are required']);
        return;
    }
    
    // Verify current password
    if (!password_verify($input['current_password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        return;
    }
    
    // Update password
    $newPasswordHash = password_hash($input['new_password'], PASSWORD_BCRYPT);
    $stmt = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
    $stmt->execute([
        'password' => $newPasswordHash,
        'id' => $user['id']
    ]);
    
    echo json_encode(['success' => true, 'message' => 'Password changed successfully']);
}
