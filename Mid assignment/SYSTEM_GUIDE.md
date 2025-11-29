# Employee Management System - Complete Guide

## 🎯 System Overview

Your employee management system has been extended with:
- ✅ User Authentication (Admin & Employee roles)
- ✅ Attendance Tracking (Check-in/Check-out with duration)
- ✅ Leave Management (Request, Approve, Reject)
- ✅ Admin Dashboard (Monitor attendance & approve leaves)
- ✅ Employee Dashboard (Self-service portal)

---

## 🚀 Quick Start

### 1. Start the Application

```bash
cd "/home/abdul-rehman/Desktop/CS/Web-Technologies/Mid assignment"
sudo docker compose up -d --build
```

### 2. Access the Application

- **Login Page**: http://localhost:8081/login.html
- **Admin Dashboard**: http://localhost:8081/ (after admin login)
- **Employee Dashboard**: http://localhost:8081/employee-dashboard.html (after employee login)

### 3. Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Role: Admin (can manage employees, approve leaves, view attendance)

**Sample Employee Accounts:**
All existing employees have been automatically created with their employee ID as both username and password.

Example:
- If employee ID is `1`, then username: `1` and password: `1`
- If employee ID is `2`, then username: `2` and password: `2`

---

## 👥 User Roles & Features

### Admin Features

1. **Employee Management** (Main Dashboard)
   - View all employees
   - Add new employees
   - Edit employee details
   - Delete employees
   - Employees automatically get user accounts

2. **Attendance Monitoring** (Attendance Page)
   - View real-time attendance status
   - See who's checked in/out
   - View work duration for each employee
   - Filter attendance by date
   - Statistics: Total, Checked In, Checked Out, Absent

3. **Leave Management** (Leaves Page)
   - View all leave requests
   - Filter by status (Pending/Approved/Rejected)
   - Approve or reject leave requests
   - Add admin notes to leave decisions
   - View employee leave history

### Employee Features

1. **Attendance Tracking**
   - Check-in when starting work
   - Check-out when finishing work
   - View current work duration
   - View attendance history

2. **Leave Management**
   - Apply for leave (4 types: Sick, Casual, Annual, Other)
   - View leave status (Pending/Approved/Rejected)
   - Delete pending leave requests
   - View leave history with admin notes

---

## 📋 Workflow Examples

### Employee Daily Workflow

1. **Login** at http://localhost:8081/login.html
2. **Check-in** when arriving at work
   - Click "Check In" button
   - System records timestamp
3. **Work** throughout the day
   - Dashboard shows current work duration in real-time
4. **Check-out** when leaving
   - Click "Check Out" button
   - System calculates total work duration

### Employee Leave Request Workflow

1. **Apply for Leave**
   - Go to "Apply for Leave" section
   - Select leave type (Sick/Casual/Annual/Other)
   - Choose start and end dates
   - Provide reason
   - Submit request
2. **Wait for Approval**
   - View request status in "My Leave Requests" section
3. **Receive Notification**
   - Status updates to "Approved" or "Rejected"
   - View admin notes if any

### Admin Approval Workflow

1. **View Pending Requests**
   - Go to "Manage Leaves" page
   - See all pending leave requests
2. **Review Request**
   - Check employee details
   - Review leave dates and reason
3. **Make Decision**
   - Click "Approve" or "Reject"
   - Optionally add admin notes
   - Confirm action
4. **Employee Notification**
   - Employee sees updated status in their dashboard

---

## 🗄️ Database Structure

### New Tables Created

1. **users**
   - Stores user authentication data
   - Links to employees table
   - Roles: admin, employee

2. **sessions**
   - Manages login tokens
   - 8-hour session expiry

3. **attendance**
   - Check-in/Check-out timestamps
   - Work duration in minutes
   - One record per employee per day

4. **leave_requests**
   - Leave type, dates, reason
   - Status: pending, approved, rejected
   - Admin notes and reviewer details

---

## 🔐 Security Features

- Password hashing (BCrypt)
- Token-based authentication
- Session expiration (8 hours)
- Role-based access control
- SQL injection prevention (Prepared statements)
- XSS protection (HTML escaping)

---

## 🛠️ API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/verify` - Verify token
- `PUT /auth/change-password` - Change password

### Attendance
- `POST /attendance/check-in` - Check in
- `PUT /attendance/check-out` - Check out
- `GET /attendance/status` - Current status
- `GET /attendance/history` - Attendance history
- `GET /attendance/report` - Admin report (with date filter)

### Leave Management
- `GET /leaves` - Get leaves (filtered by role)
- `POST /leaves` - Create leave request
- `PUT /leaves/approve/:id` - Approve leave (admin only)
- `PUT /leaves/reject/:id` - Reject leave (admin only)
- `DELETE /leaves/:id` - Delete pending leave

### Employee Management
- `GET /api/employees` - List employees
- `POST /api/employees` - Add employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

---

## 📱 Page Navigation

### Admin Navigation
```
Login → Admin Dashboard (index.html)
  ├── View Attendance → admin-attendance.html
  ├── Manage Leaves → admin-leaves.html
  └── Logout → login.html
```

### Employee Navigation
```
Login → Employee Dashboard (employee-dashboard.html)
  ├── Check In/Out (same page)
  ├── Apply for Leave (same page)
  ├── View Leave History (same page)
  └── Logout → login.html
```

---

## 🐛 Troubleshooting

### Docker Issues

**Issue:** Permission denied when running docker commands
**Solution:** 
```bash
# Use sudo
sudo docker compose up -d

# OR add user to docker group
sudo usermod -aG docker $USER
# Then logout and login again
```

**Issue:** Containers not starting
**Solution:**
```bash
# Check container logs
sudo docker compose logs

# Restart containers
sudo docker compose down
sudo docker compose up -d --build
```

### Authentication Issues

**Issue:** Can't login with admin credentials
**Solution:**
- Check if database initialized properly
- Default admin: username=`admin`, password=`admin123`
- Check browser console for errors

**Issue:** Session expired error
**Solution:**
- Sessions expire after 8 hours
- Login again to get new token

### Attendance Issues

**Issue:** Can't check-in/check-out
**Solution:**
- Check if you're already checked in (can only check in once per day)
- Verify authentication token is valid
- Check browser console for errors

---

## 🔄 Testing Checklist

### Admin Testing
- [ ] Login with admin credentials
- [ ] View employee list
- [ ] Add new employee
- [ ] Navigate to Attendance page
- [ ] View today's attendance
- [ ] Filter attendance by date
- [ ] Navigate to Leaves page
- [ ] View pending leave requests
- [ ] Approve a leave request
- [ ] Reject a leave request
- [ ] Logout

### Employee Testing
- [ ] Login with employee credentials (use employee ID as username/password)
- [ ] Check in at start of day
- [ ] Verify duration updates in real-time
- [ ] Check out at end of day
- [ ] Apply for sick leave
- [ ] Apply for casual leave
- [ ] View leave request status
- [ ] Delete a pending leave request
- [ ] View attendance history
- [ ] Logout

---

## 📊 Sample Data

The system includes:
- 1 default admin account
- All existing employees converted to user accounts
- No sample attendance records (will be created when employees check in)
- No sample leave requests (will be created when employees apply)

---

## 🎨 UI Features

- Responsive design (works on mobile and desktop)
- Real-time updates (auto-refresh every 30 seconds)
- Interactive alerts and notifications
- Color-coded status indicators:
  - 🟢 Green = Approved/Checked In
  - 🔵 Blue = Checked Out
  - 🟡 Yellow = Pending
  - 🔴 Red = Rejected/Absent
  - ⚫ Gray = No data

---

## 💡 Tips

1. **For Admins:**
   - Check pending leaves regularly
   - Monitor attendance daily
   - Add notes when rejecting leaves for clarity

2. **For Employees:**
   - Check in as soon as you arrive
   - Apply for leaves in advance
   - Check your dashboard for approval status
   - Don't forget to check out before leaving

3. **General:**
   - Sessions expire after 8 hours of inactivity
   - You can only check in once per day
   - Leave requests can only be deleted if pending
   - Work duration is calculated in minutes and displayed as hours:minutes

---

## 📝 Future Enhancements (Optional)

- Email notifications for leave approvals
- Monthly attendance reports (PDF export)
- Late arrival tracking
- Overtime calculation
- Leave balance tracking
- Calendar view for leaves
- Employee performance metrics
- Mobile app

---

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors (F12)
2. Check Docker container logs: `sudo docker compose logs`
3. Verify database is running: `sudo docker compose ps`
4. Restart the system: `sudo docker compose restart`

---

**System Status:** ✅ Ready to use!

**Next Steps:**
1. Start Docker containers
2. Login as admin (admin/admin123)
3. Verify all features work
4. Add/test employee accounts
5. Test complete workflow

Enjoy your enhanced employee management system! 🚀
