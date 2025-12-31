# 📋 Task/Project Management System

A full-stack MERN (MongoDB, Express.js, React, Node.js) application for managing tasks and projects with a beautiful, professional UI.

![Task Manager Banner](https://via.placeholder.com/1200x400/6366F1/FFFFFF?text=Task+Management+System)

## 🌟 Features

### Project Management
- ✅ Create, edit, and delete projects
- ✅ Assign team members to projects
- ✅ Track project progress with status indicators
- ✅ Color-coded projects for easy identification
- ✅ Project deadlines and due dates

### Task Management
- ✅ Kanban board with drag-and-drop functionality
- ✅ Create tasks with priority levels (Low, Medium, High, Critical)
- ✅ Assign tasks to team members
- ✅ Track task status (To Do, In Progress, In Review, Completed)
- ✅ Subtasks for breaking down work
- ✅ Due date tracking with overdue warnings

### Team Collaboration
- ✅ Team member management
- ✅ User roles (Admin, Manager, Member)
- ✅ Activity feed showing recent actions
- ✅ Comments on tasks
- ✅ File attachments support

### User Experience
- ✅ Modern, responsive design
- ✅ Dark/Light theme ready
- ✅ Real-time notifications
- ✅ Search and filtering
- ✅ Dashboard with statistics

## 🛠️ Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File uploads |
| express-validator | Request validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Vite | Build tool |
| TailwindCSS | Styling |
| React Router v6 | Routing |
| Axios | HTTP client |
| @hello-pangea/dnd | Drag and drop |
| Lucide React | Icons |
| React Hot Toast | Notifications |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Container orchestration |
| Nginx | Production web server |

## 📁 Project Structure

```
MERN App/
├── backend/                 # Backend API
│   ├── config/             # Configuration files
│   │   └── db.js           # Database connection
│   ├── controllers/        # Route controllers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   ├── comment.controller.js
│   │   └── dashboard.controller.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   └── upload.middleware.js
│   ├── models/             # Mongoose models
│   │   ├── User.model.js
│   │   ├── Project.model.js
│   │   ├── Task.model.js
│   │   └── Comment.model.js
│   ├── routes/             # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   ├── comment.routes.js
│   │   └── dashboard.routes.js
│   ├── uploads/            # Uploaded files
│   ├── .env                # Environment variables
│   ├── .env.example        # Example environment
│   ├── Dockerfile          # Docker configuration
│   ├── package.json        # Dependencies
│   └── server.js           # Entry point
│
├── frontend/               # React Frontend
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   └── layout/     # Layout components
│   │   │       ├── Layout.jsx
│   │   │       └── AuthLayout.jsx
│   │   ├── context/        # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Team.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── App.jsx         # Main App component
│   │   ├── index.css       # Global styles
│   │   └── main.jsx        # Entry point
│   ├── .dockerignore       # Docker ignore
│   ├── Dockerfile          # Docker configuration
│   ├── index.html          # HTML template
│   ├── nginx.conf          # Nginx configuration
│   ├── package.json        # Dependencies
│   ├── postcss.config.js   # PostCSS config
│   ├── tailwind.config.js  # Tailwind config
│   └── vite.config.js      # Vite config
│
├── docker-compose.yml      # Docker orchestration
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Docker** & **Docker Compose** (for containerized setup)

### Option 1: Docker Setup (Recommended)

The easiest way to run the entire application:

```bash
# Clone the repository
git clone <repository-url>
cd "MERN App"

# Start all services with Docker Compose
docker-compose up --build

# The application will be available at:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:5000
# - MongoDB: localhost:27017
```

To stop the application:
```bash
docker-compose down

# To also remove volumes (database data):
docker-compose down -v
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/taskmanager
# JWT_SECRET=your-secret-key

# Start the server
npm run dev
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Default Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 5000 | http://localhost:5000 |
| MongoDB | 27017 | mongodb://localhost:27017 |

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | User logout |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/team/members` | Get team members |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/password` | Change password |
| POST | `/api/users/avatar` | Upload avatar |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get single project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/project/:projectId` | Get project tasks |
| GET | `/api/tasks/my/tasks` | Get user's tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/status` | Update task status |
| DELETE | `/api/tasks/:id` | Delete task |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/task/:taskId` | Get task comments |
| POST | `/api/comments` | Create comment |
| DELETE | `/api/comments/:id` | Delete comment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard stats |
| GET | `/api/dashboard/activity` | Get recent activity |

## 🎨 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x500/F3F4F6/374151?text=Dashboard+View)

### Kanban Board
![Kanban](https://via.placeholder.com/800x500/F3F4F6/374151?text=Kanban+Board)

### Project List
![Projects](https://via.placeholder.com/800x500/F3F4F6/374151?text=Projects+List)

## 🔧 Environment Variables

### Backend (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/taskmanager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7

# File Upload
MAX_FILE_SIZE=10485760

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

## 📝 Code Comments

The codebase is thoroughly commented to help understand the implementation:

```javascript
/**
 * ===========================================
 * Example Controller Function
 * ===========================================
 * 
 * This controller handles [specific functionality].
 * 
 * @route   GET /api/example
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 */
const exampleFunction = async (req, res) => {
  // Implementation with inline comments
};
```

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 🚢 Production Deployment

### Using Docker
```bash
# Build and run production containers
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f
```

### Manual Deployment

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Set production environment variables
3. Start the backend server:
```bash
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Abdul Rehman**

- University Assignment: Web Technologies (5th Semester)
- Project: Task/Project Management System

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Docker](https://www.docker.com/)

---

<p align="center">
  Made with ❤️ for Web Technologies Course
</p>
