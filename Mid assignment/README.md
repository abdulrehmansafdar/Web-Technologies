# Employee Management System

A full-stack Employee Management System with CRUD operations built using TypeScript, PHP, MySQL, and Docker.

## 🚀 Tech Stack

- **Frontend**: TypeScript + TailwindCSS
- **Backend**: PHP 8.1 with PDO
- **Database**: MySQL 8.0
- **Containerization**: Docker & Docker Compose

## 📋 Features

- ✅ Create, Read, Update, Delete (CRUD) employees
- 📊 Dashboard with statistics (total employees, average salary, positions)
- 📄 Paginated employee listing
- 🎨 Modern, responsive UI with TailwindCSS
- 🔔 Toast notifications for user actions
- 🐳 Fully containerized with Docker
- 💾 phpMyAdmin for database management

## 🏗️ Project Structure

```
├── backend/
│   ├── Dockerfile
│   ├── config.php          # Database configuration
│   └── index.php           # REST API endpoints
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html          # Main UI
│   ├── app.js              # Application logic
│   └── types.ts            # TypeScript type definitions
├── db/
│   └── init.sql            # Database initialization
├── docker-compose.yml       # Docker orchestration
└── README.md
```

## 🔌 API Endpoints

### Base URL: `http://localhost:8080`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/?page=1&limit=10` | Get all employees (paginated) |
| GET | `/{id}` | Get single employee |
| POST | `/` | Create new employee |
| PUT | `/{id}` | Update employee |
| DELETE | `/{id}` | Delete employee |

### Request/Response Examples

#### Create Employee (POST)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "position": "Software Engineer",
  "salary": 75000.00
}
```

#### Response
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "position": "Software Engineer",
    "salary": "75000.00",
    "created_at": "2025-10-31 12:00:00",
    "updated_at": "2025-10-31 12:00:00"
  }
}
```

## 🚀 Getting Started

### Prerequisites

- Docker Desktop installed
- Docker Compose installed

### Installation & Setup

1. **Clone or navigate to the project directory**
   ```bash
   git clone https://github.com/abdulrehmansafdar/Web-Technologies.git
   cd "/Mid assignment"
   ```

2. **Start all containers**
   ```bash
   docker-compose up -d
   ```
   **On Linux Distros**
   ```bash
   sudo docker compose up -d
   ```

3. **Wait for services to initialize** (about 30-60 seconds)

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8080
   - **phpMyAdmin**: http://localhost:8081

### Default Database Credentials

- **Host**: db
- **Database**: employee_management
- **Username**: appuser
- **Password**: apppassword
- **Root Password**: rootpassword

## 📱 Usage

### Adding an Employee
1. Click the "Add Employee" button
2. Fill in the form with employee details
3. Click "Add Employee" to save

### Editing an Employee
1. Click the edit icon (pencil) next to an employee
2. Update the details in the modal
3. Click "Update Employee" to save changes

### Deleting an Employee
1. Click the delete icon (trash) next to an employee
2. Confirm the deletion in the modal
3. Employee will be permanently removed

### Viewing Employees
- Employees are displayed in a paginated table
- Use pagination controls at the bottom to navigate
- View statistics at the top of the dashboard

## 🛠️ Development

### Stop Containers
```bash
docker-compose down
```

### View Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Rebuild Containers
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Access MySQL Database
```bash
docker exec -it employee_db mysql -u appuser -papppassword employee_management
```

## 🗄️ Database Schema

### Employees Table

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key, auto-increment |
| name | VARCHAR(255) | Employee name |
| email | VARCHAR(255) | Employee email (unique) |
| position | VARCHAR(255) | Job position |
| salary | DECIMAL(10,2) | Employee salary |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## 🔒 Security Features

- CORS enabled for cross-origin requests
- Prepared statements to prevent SQL injection
- Input validation on both frontend and backend
- XSS protection with HTML escaping
- Email validation

## 🐛 Troubleshooting

### Port Already in Use
If ports 3000, 8080, 8081, or 3306 are already in use:
1. Stop the conflicting service
2. Or modify ports in `docker-compose.yml`

### Database Connection Failed
1. Ensure MySQL container is running: `docker ps`
2. Check logs: `docker-compose logs db`
3. Wait for MySQL to fully initialize (can take 30-60 seconds)

### Frontend Can't Connect to Backend
1. Verify backend is running: `docker ps`
2. Check backend logs: `docker-compose logs backend`
3. Ensure API_BASE_URL in `app.js` points to `http://localhost:8080`

## 📦 Docker Services

- **db**: MySQL 8.0 database server
- **backend**: PHP 8.1 with Apache
- **frontend**: Nginx serving static files
- **phpmyadmin**: Web-based database management

## 🎯 Future Enhancements

- User authentication and authorization
- Employee attendance tracking
- Advanced search and filtering
- Export data to CSV/PDF
- Dark mode toggle
- Role-based access control

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Built as a Web Technology mid-semester assignment.

---

**Happy Coding! 🚀**
