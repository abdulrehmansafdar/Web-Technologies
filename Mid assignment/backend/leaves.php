<?php
require_once 'config.php';
require_once 'auth.php';

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

// Parse path for action and ID
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extract action and ID from path
$action = null;
$id = null;

for ($i = 0; $i < count($pathParts); $i++) {
    if ($pathParts[$i] === 'leaves') {
        if (isset($pathParts[$i + 1])) {
            if (is_numeric($pathParts[$i + 1])) {
                $id = (int)$pathParts[$i + 1];
            } else {
                $action = $pathParts[$i + 1];
                if (isset($pathParts[$i + 2]) && is_numeric($pathParts[$i + 2])) {
                    $id = (int)$pathParts[$i + 2];
                }
            }
        }
        break;
    }
}

try {
    $db = getDBConnection();
    $user = authenticate($db);
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            if ($action === 'approve' && $id) {
                handleApprove($db, $user, $id, 'approved');
            } elseif ($action === 'reject' && $id) {
                handleApprove($db, $user, $id, 'rejected');
            } else {
                handleGetLeaves($db, $user);
            }
            break;
            
        case 'POST':
            handleCreateLeave($db, $user, $input);
            break;
            
        case 'PUT':
            if ($action === 'approve' && $id) {
                handleApprove($db, $user, $id, 'approved', $input);
            } elseif ($action === 'reject' && $id) {
                handleApprove($db, $user, $id, 'rejected', $input);
            }
            break;
            
        case 'DELETE':
            if ($id) {
                handleDeleteLeave($db, $user, $id);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Leave ID required']);
            }
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

// Get leave requests
function handleGetLeaves($db, $user) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    
    if ($user['role'] === 'employee') {
        // Employee - their own leaves
        $where = "WHERE l.employee_id = :employee_id";
        $params = ['employee_id' => $user['employee_id']];
        
        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $where .= " AND l.status = :status";
            $params['status'] = $status;
        }
        
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM leave_requests l $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        $stmt = $db->prepare("
            SELECT l.*, 
                   e.name as employee_name, 
                   e.email as employee_email,
                   u.username as approved_by_username
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.id
            LEFT JOIN users u ON l.approved_by = u.id
            $where
            ORDER BY l.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $params[':limit'] = $limit;
        $params[':offset'] = $offset;
        $stmt->execute($params);
        
    } else {
        // Admin - all leaves
        $employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;
        
        $where = "WHERE 1=1";
        $params = [];
        
        if ($employeeId) {
            $where .= " AND l.employee_id = :employee_id";
            $params['employee_id'] = $employeeId;
        }
        
        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $where .= " AND l.status = :status";
            $params['status'] = $status;
        }
        
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM leave_requests l $where");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        $stmt = $db->prepare("
            SELECT l.*, 
                   e.name as employee_name, 
                   e.email as employee_email,
                   e.position,
                   u.username as approved_by_username
            FROM leave_requests l
            JOIN employees e ON l.employee_id = e.id
            LEFT JOIN users u ON l.approved_by = u.id
            $where
            ORDER BY 
                CASE l.status 
                    WHEN 'pending' THEN 1 
                    WHEN 'approved' THEN 2 
                    WHEN 'rejected' THEN 3 
                END,
                l.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        $params[':limit'] = $limit;
        $params[':offset'] = $offset;
        $stmt->execute($params);
    }
    
    $leaves = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $leaves,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

// Create leave request
function handleCreateLeave($db, $user, $input) {
    if ($user['role'] !== 'employee') {
        http_response_code(403);
        echo json_encode(['error' => 'Only employees can request leave']);
        return;
    }
    
    if (!isset($input['leave_date'], $input['reason'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Leave date and reason are required']);
        return;
    }
    
    $leaveDate = $input['leave_date'];
    $leaveType = isset($input['leave_type']) ? $input['leave_type'] : 'casual';
    $reason = $input['reason'];
    
    // Validate leave type
    if (!in_array($leaveType, ['sick', 'casual', 'annual', 'other'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid leave type']);
        return;
    }
    
    // Check if leave date is in the past
    if (strtotime($leaveDate) < strtotime(date('Y-m-d'))) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot request leave for past dates']);
        return;
    }
    
    // Check if already requested for this date
    $stmt = $db->prepare("
        SELECT * FROM leave_requests 
        WHERE employee_id = :employee_id AND leave_date = :leave_date
    ");
    $stmt->execute([
        'employee_id' => $user['employee_id'],
        'leave_date' => $leaveDate
    ]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Leave already requested for this date']);
        return;
    }
    
    // Create leave request
    $stmt = $db->prepare("
        INSERT INTO leave_requests (employee_id, leave_date, leave_type, reason, status) 
        VALUES (:employee_id, :leave_date, :leave_type, :reason, 'pending')
    ");
    $stmt->execute([
        'employee_id' => $user['employee_id'],
        'leave_date' => $leaveDate,
        'leave_type' => $leaveType,
        'reason' => $reason
    ]);
    
    $leaveId = $db->lastInsertId();
    
    // Get the created record
    $stmt = $db->prepare("
        SELECT l.*, e.name as employee_name, e.email as employee_email
        FROM leave_requests l
        JOIN employees e ON l.employee_id = e.id
        WHERE l.id = :id
    ");
    $stmt->execute(['id' => $leaveId]);
    $leave = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Leave request submitted successfully',
        'data' => $leave
    ]);
}

// Approve or reject leave
function handleApprove($db, $user, $id, $action, $input = null) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Only admin can approve/reject leaves']);
        return;
    }
    
    // Get leave request
    $stmt = $db->prepare("SELECT * FROM leave_requests WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $leave = $stmt->fetch();
    
    if (!$leave) {
        http_response_code(404);
        echo json_encode(['error' => 'Leave request not found']);
        return;
    }
    
    if ($leave['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(['error' => 'Leave request already ' . $leave['status']]);
        return;
    }
    
    $adminNotes = isset($input['admin_notes']) ? $input['admin_notes'] : null;
    
    // Update leave status
    $stmt = $db->prepare("
        UPDATE leave_requests 
        SET status = :status, 
            approved_by = :approved_by, 
            approved_at = NOW(),
            admin_notes = :admin_notes
        WHERE id = :id
    ");
    $stmt->execute([
        'status' => $action,
        'approved_by' => $user['id'],
        'admin_notes' => $adminNotes,
        'id' => $id
    ]);
    
    // Get updated record
    $stmt = $db->prepare("
        SELECT l.*, 
               e.name as employee_name, 
               e.email as employee_email,
               u.username as approved_by_username
        FROM leave_requests l
        JOIN employees e ON l.employee_id = e.id
        LEFT JOIN users u ON l.approved_by = u.id
        WHERE l.id = :id
    ");
    $stmt->execute(['id' => $id]);
    $leave = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Leave request ' . $action . ' successfully',
        'data' => $leave
    ]);
}

// Delete leave request
function handleDeleteLeave($db, $user, $id) {
    // Get leave request
    $stmt = $db->prepare("SELECT * FROM leave_requests WHERE id = :id");
    $stmt->execute(['id' => $id]);
    $leave = $stmt->fetch();
    
    if (!$leave) {
        http_response_code(404);
        echo json_encode(['error' => 'Leave request not found']);
        return;
    }
    
    // Check permissions
    if ($user['role'] === 'employee' && $leave['employee_id'] !== $user['employee_id']) {
        http_response_code(403);
        echo json_encode(['error' => 'Cannot delete other employee\'s leave request']);
        return;
    }
    
    // Only allow deletion if pending
    if ($leave['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete ' . $leave['status'] . ' leave request']);
        return;
    }
    
    // Delete leave request
    $stmt = $db->prepare("DELETE FROM leave_requests WHERE id = :id");
    $stmt->execute(['id' => $id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Leave request deleted successfully'
    ]);
}
