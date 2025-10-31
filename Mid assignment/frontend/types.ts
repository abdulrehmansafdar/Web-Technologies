// TypeScript type definitions for Employee Management System

interface Employee {
    id: number;
    name: string;
    email: string;
    position: string;
    salary: number;
    created_at: string;
    updated_at: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    pagination?: PaginationInfo;
}

type AlertType = 'success' | 'error' | 'warning' | 'info';
