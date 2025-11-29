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

// Parse the action from the URL
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Find 'attendance' in the path and get the next part as action
$action = null;
for ($i = 0; $i < count($pathParts); $i++) {
    if ($pathParts[$i] === 'attendance' && isset($pathParts[$i + 1])) {
        $action = $pathParts[$i + 1];
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
    
    switch ($action) {
        case 'check-in':
            handleCheckIn($db, $user);
            break;
            
        case 'check-out':
            handleCheckOut($db, $user);
            break;
            
        case 'status':
            handleStatus($db, $user);
            break;
            
        case 'history':
            handleHistory($db, $user);
            break;
            
        case 'report':
            handleReport($db, $user);
            break;
            
        case 'today':
            handleToday($db, $user);
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

// Check-in handler
function handleCheckIn($db, $user) {
    if ($user['role'] !== 'employee') {
        http_response_code(403);
        echo json_encode(['error' => 'Only employees can check in']);
        return;
    }
    
    $today = date('Y-m-d');
    
    // Check if already checked in today
    $stmt = $db->prepare("
        SELECT * FROM attendance 
        WHERE employee_id = :employee_id AND date = :date AND check_out IS NULL
    ");
    $stmt->execute([
        'employee_id' => $user['employee_id'],
        'date' => $today
    ]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Already checked in today']);
        return;
    }
    
    // Create check-in record
    $stmt = $db->prepare("
        INSERT INTO attendance (employee_id, check_in, date, status) 
        VALUES (:employee_id, NOW(), :date, 'checked_in')
    ");
    $stmt->execute([
        'employee_id' => $user['employee_id'],
        'date' => $today
    ]);
    
    $attendanceId = $db->lastInsertId();
    
    // Get the created record
    $stmt = $db->prepare("SELECT * FROM attendance WHERE id = :id");
    $stmt->execute(['id' => $attendanceId]);
    $attendance = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Checked in successfully',
        'data' => $attendance
    ]);
}

// Check-out handler
function handleCheckOut($db, $user) {
    if ($user['role'] !== 'employee') {
        http_response_code(403);
        echo json_encode(['error' => 'Only employees can check out']);
        return;
    }
    
    $today = date('Y-m-d');
    
    // Get today's check-in record
    $stmt = $db->prepare("
        SELECT * FROM attendance 
        WHERE employee_id = :employee_id AND date = :date AND check_out IS NULL
    ");
    $stmt->execute([
        'employee_id' => $user['employee_id'],
        'date' => $today
    ]);
    
    $attendance = $stmt->fetch();
    
    if (!$attendance) {
        http_response_code(400);
        echo json_encode(['error' => 'No active check-in found for today']);
        return;
    }
    
    // Calculate work duration
    $checkIn = new DateTime($attendance['check_in']);
    $checkOut = new DateTime();
    $duration = $checkOut->diff($checkIn);
    $durationMinutes = ($duration->h * 60) + $duration->i;
    
    // Update check-out
    $stmt = $db->prepare("
        UPDATE attendance 
        SET check_out = NOW(), 
            work_duration = :duration, 
            status = 'checked_out' 
        WHERE id = :id
    ");
    $stmt->execute([
        'duration' => $durationMinutes,
        'id' => $attendance['id']
    ]);
    
    // Get updated record
    $stmt = $db->prepare("SELECT * FROM attendance WHERE id = :id");
    $stmt->execute(['id' => $attendance['id']]);
    $updatedAttendance = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Checked out successfully',
        'data' => $updatedAttendance
    ]);
}

// Get current status
function handleStatus($db, $user) {
    $today = date('Y-m-d');
    
    if ($user['role'] === 'employee') {
        $stmt = $db->prepare("
            SELECT * FROM attendance 
            WHERE employee_id = :employee_id AND date = :date
            ORDER BY check_in DESC LIMIT 1
        ");
        $stmt->execute([
            'employee_id' => $user['employee_id'],
            'date' => $today
        ]);
        
        $attendance = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'data' => $attendance ?: null
        ]);
    } else {
        // Admin - get all today's attendance
        $stmt = $db->prepare("
            SELECT a.*, e.name, e.email, e.position 
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            WHERE a.date = :date
            ORDER BY a.check_in DESC
        ");
        $stmt->execute(['date' => $today]);
        $attendances = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'data' => $attendances
        ]);
    }
}

// Get attendance history
function handleHistory($db, $user) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;
    
    if ($user['role'] === 'employee') {
        // Employee - their own history
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM attendance WHERE employee_id = :employee_id");
        $stmt->execute(['employee_id' => $user['employee_id']]);
        $total = $stmt->fetch()['total'];
        
        $stmt = $db->prepare("
            SELECT * FROM attendance 
            WHERE employee_id = :employee_id
            ORDER BY date DESC, check_in DESC
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':employee_id', $user['employee_id'], PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $history = $stmt->fetchAll();
        
    } else {
        // Admin - all attendance
        $employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;
        
        if ($employeeId) {
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM attendance WHERE employee_id = :employee_id");
            $stmt->execute(['employee_id' => $employeeId]);
        } else {
            $stmt = $db->query("SELECT COUNT(*) as total FROM attendance");
        }
        $total = $stmt->fetch()['total'];
        
        if ($employeeId) {
            $stmt = $db->prepare("
                SELECT a.*, e.name, e.email, e.position 
                FROM attendance a
                JOIN employees e ON a.employee_id = e.id
                WHERE a.employee_id = :employee_id
                ORDER BY a.date DESC, a.check_in DESC
                LIMIT :limit OFFSET :offset
            ");
            $stmt->bindValue(':employee_id', $employeeId, PDO::PARAM_INT);
        } else {
            $stmt = $db->prepare("
                SELECT a.*, e.name, e.email, e.position 
                FROM attendance a
                JOIN employees e ON a.employee_id = e.id
                ORDER BY a.date DESC, a.check_in DESC
                LIMIT :limit OFFSET :offset
            ");
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $history = $stmt->fetchAll();
    }
    
    echo json_encode([
        'success' => true,
        'data' => $history,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

// Get attendance report (Admin only)
function handleReport($db, $user) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    
    $stmt = $db->prepare("
        SELECT 
            e.id as employee_id,
            e.name,
            e.email,
            e.position,
            COUNT(a.id) as total_days,
            SUM(CASE WHEN a.status = 'checked_out' THEN 1 ELSE 0 END) as completed_days,
            SUM(a.work_duration) as total_minutes,
            AVG(a.work_duration) as avg_minutes_per_day
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id 
            AND a.date BETWEEN :start_date AND :end_date
        GROUP BY e.id, e.name, e.email, e.position
        ORDER BY e.name
    ");
    $stmt->execute([
        'start_date' => $startDate,
        'end_date' => $endDate
    ]);
    $report = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $report,
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ]
    ]);
}

// Get today's attendance for all employees (Admin only)
function handleToday($db, $user) {
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        return;
    }
    
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    $stmt = $db->prepare("
        SELECT 
            a.*,
            e.name as employee_name,
            e.email as employee_email,
            e.position
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.date = :date
        ORDER BY a.check_in DESC
    ");
    $stmt->execute(['date' => $date]);
    $records = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $records,
        'date' => $date
    ]);
}
