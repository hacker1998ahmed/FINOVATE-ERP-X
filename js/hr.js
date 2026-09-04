/**
 * FINOVATE ERP X - Human Resources Module
 * Phase 10-11: HR + Employees + Payroll + Attendance + Leaves
 * 
 * Features:
 * - Employee Management (Personal Info, Job Details, Documents)
 * - Departments & Branches Assignment
 * - Attendance Tracking (Check-in/Check-out, Late, Absence)
 * - Leave Management (Vacation, Sick, Emergency, etc.)
 * - Payroll Engine (Salary, Allowances, Deductions, Loans)
 * - Contract Management
 * - Performance Reviews
 */

class HRModule {
    constructor() {
        this.employees = [];
        this.departments = [];
        this.attendanceRecords = [];
        this.leaves = [];
        this.payrolls = [];
        this.contracts = [];
        this.allowanceTypes = [];
        this.deductionTypes = [];
        this.init();
    }

    async init() {
        await this.loadDepartments();
        await this.loadEmployees();
        await this.loadAttendanceRecords();
        await this.loadLeaves();
        await this.loadPayrolls();
        await this.loadContracts();
        await this.loadAllowanceTypes();
        await this.loadDeductionTypes();
    }

    // ==================== Departments ====================
    
    async loadDepartments() {
        try {
            const response = await api.get('departments');
            this.departments = response.data || this.getDefaultDepartments();
        } catch (error) {
            console.error('Error loading departments:', error);
            this.departments = this.getDefaultDepartments();
        }
    }

    getDefaultDepartments() {
        return [
            { id: 'DEPT-001', code: 'ADMIN', nameEn: 'Administration', nameAr: 'الإدارة', isActive: true },
            { id: 'DEPT-002', code: 'HR', nameEn: 'Human Resources', nameAr: 'الموارد البشرية', isActive: true },
            { id: 'DEPT-003', code: 'ACC', nameEn: 'Accounting', nameAr: 'المحاسبة', isActive: true },
            { id: 'DEPT-004', code: 'SALES', nameEn: 'Sales', nameAr: 'المبيعات', isActive: true },
            { id: 'DEPT-005', code: 'PURCH', nameEn: 'Purchasing', nameAr: 'المشتريات', isActive: true },
            { id: 'DEPT-006', code: 'STORE', nameEn: 'Warehouse', nameAr: 'المخزن', isActive: true },
            { id: 'DEPT-007', code: 'PROD', nameEn: 'Production', nameAr: 'الإنتاج', isActive: true },
            { id: 'DEPT-008', code: 'IT', nameEn: 'Information Technology', nameAr: 'تكنولوجيا المعلومات', isActive: true }
        ];
    }

    async createDepartment(deptData) {
        const newDept = {
            id: 'DEPT-' + Date.now(),
            code: deptData.code,
            nameEn: deptData.nameEn,
            nameAr: deptData.nameAr,
            managerId: deptData.managerId,
            parentId: deptData.parentId,
            isActive: true,
            companyId: companies.getCurrentCompany()?.id,
            branchId: companies.getCurrentBranch()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.departments.push(newDept);
        
        try {
            await api.post('departments', newDept);
            return newDept;
        } catch (error) {
            console.error('Error creating department:', error);
            throw error;
        }
    }

    // ==================== Employees ====================
    
    async loadEmployees() {
        try {
            const response = await api.get('employees');
            this.employees = response.data || [];
        } catch (error) {
            console.error('Error loading employees:', error);
            this.employees = [];
        }
    }

    async createEmployee(employeeData) {
        const newEmployee = {
            id: 'EMP-' + Date.now(),
            employeeNumber: this.generateEmployeeNumber(),
            firstNameEn: employeeData.firstNameEn,
            lastNameEn: employeeData.lastNameEn,
            firstNameAr: employeeData.firstNameAr,
            lastNameAr: employeeData.lastNameAr,
            email: employeeData.email,
            phone: employeeData.phone,
            nationalId: employeeData.nationalId,
            dateOfBirth: employeeData.dateOfBirth,
            gender: employeeData.gender, // male, female
            maritalStatus: employeeData.maritalStatus, // single, married, divorced, widowed
            nationality: employeeData.nationality,
            address: employeeData.address,
            
            // Job Details
            departmentId: employeeData.departmentId,
            branchId: employeeData.branchId || companies.getCurrentBranch()?.id,
            jobId: employeeData.jobId,
            jobTitle: employeeData.jobTitle,
            hireDate: employeeData.hireDate,
            employmentType: employeeData.employmentType, // full_time, part_time, contract, temporary
            
            // Salary
            basicSalary: employeeData.basicSalary || 0,
            currency: employeeData.currency || 'EGP',
            
            // Bank Details
            bankAccountId: employeeData.bankAccountId,
            bankName: employeeData.bankName,
            bankAccountNumber: employeeData.bankAccountNumber,
            
            // Status
            status: employeeData.status || 'active', // active, on_leave, suspended, terminated
            terminationDate: null,
            terminationReason: null,
            
            // Documents
            documents: [],
            
            companyId: companies.getCurrentCompany()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.employees.push(newEmployee);
        
        try {
            await api.post('employees', newEmployee);
            return newEmployee;
        } catch (error) {
            console.error('Error creating employee:', error);
            throw error;
        }
    }

    generateEmployeeNumber() {
        const year = new Date().getFullYear();
        const count = this.employees.filter(e => 
            e.employeeNumber?.startsWith(`EMP-${year}`)
        ).length + 1;
        return `EMP-${year}-${String(count).padStart(4, '0')}`;
    }

    getEmployeeFullName(employeeId, lang = null) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return '';
        
        const language = lang || localization.getCurrentLanguage();
        if (language === 'ar') {
            return `${employee.firstNameAr} ${employee.lastNameAr}`;
        }
        return `${employee.firstNameEn} ${employee.lastNameEn}`;
    }

    async updateEmployeeStatus(employeeId, status, reason = null) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) throw new Error('Employee not found');
        
        employee.status = status;
        if (status === 'terminated') {
            employee.terminationDate = new Date().toISOString();
            employee.terminationReason = reason;
        }
        
        try {
            await api.put(`employees/${employeeId}`, { status, reason });
            return employee;
        } catch (error) {
            console.error('Error updating employee status:', error);
            throw error;
        }
    }

    // ==================== Contracts ====================
    
    async loadContracts() {
        try {
            const response = await api.get('employee-contracts');
            this.contracts = response.data || [];
        } catch (error) {
            console.error('Error loading contracts:', error);
            this.contracts = [];
        }
    }

    async createContract(contractData) {
        const contract = {
            id: 'CONT-' + Date.now(),
            employeeId: contractData.employeeId,
            contractType: contractData.contractType, // permanent, fixed_term, temporary, freelance
            startDate: contractData.startDate,
            endDate: contractData.endDate,
            salary: contractData.salary,
            currency: contractData.currency || 'EGP',
            workingHours: contractData.workingHours || 8,
            workingDays: contractData.workingDays || 5,
            probationPeriod: contractData.probationPeriod || 0, // months
            noticePeriod: contractData.noticePeriod || 30, // days
            benefits: contractData.benefits || [],
            clauses: contractData.clauses || [],
            status: 'active', // active, expired, terminated
            signedAt: new Date().toISOString(),
            companyId: companies.getCurrentCompany()?.id,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.contracts.push(contract);
        
        try {
            await api.post('employee-contracts', contract);
            return contract;
        } catch (error) {
            console.error('Error creating contract:', error);
            throw error;
        }
    }

    // ==================== Attendance ====================
    
    async loadAttendanceRecords() {
        try {
            const response = await api.get('attendance');
            this.attendanceRecords = response.data || [];
        } catch (error) {
            console.error('Error loading attendance:', error);
            this.attendanceRecords = [];
        }
    }

    checkIn(employeeId, timestamp = null, location = null) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) throw new Error('Employee not found');
        
        if (employee.status !== 'active') {
            throw new Error('Employee is not active');
        }
        
        const today = timestamp ? new Date(timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        // Check if already checked in today
        const existingRecord = this.attendanceRecords.find(r => 
            r.employeeId === employeeId && 
            r.date === today
        );
        
        if (existingRecord) {
            throw new Error('Employee already checked in today');
        }
        
        const workStartTime = '09:00:00'; // Configurable
        const checkInTime = timestamp ? new Date(timestamp).toTimeString().split(' ')[0] : new Date().toTimeString().split(' ')[0];
        
        const isLate = checkInTime > workStartTime;
        const lateMinutes = isLate ? Math.floor((new Date(`1970-01-01T${checkInTime}`) - new Date(`1970-01-01T${workStartTime}`)) / 60000) : 0;
        
        const record = {
            id: 'ATT-' + Date.now(),
            employeeId,
            employeeName: this.getEmployeeFullName(employeeId),
            date: today,
            checkIn: checkInTime,
            checkOut: null,
            workHours: 0,
            overtimeHours: 0,
            isLate,
            lateMinutes,
            isEarlyLeave: false,
            earlyLeaveMinutes: 0,
            status: 'checked_in', // checked_in, completed, absent, on_leave
            location,
            notes: '',
            companyId: companies.getCurrentCompany()?.id,
            branchId: employee.branchId,
            createdAt: new Date().toISOString()
        };
        
        this.attendanceRecords.push(record);
        return record;
    }

    checkOut(employeeId, timestamp = null, location = null) {
        const today = timestamp ? new Date(timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        const record = this.attendanceRecords.find(r => 
            r.employeeId === employeeId && 
            r.date === today
        );
        
        if (!record) {
            throw new Error('No check-in record found for today');
        }
        
        if (record.status === 'completed') {
            throw new Error('Already checked out today');
        }
        
        const checkOutTime = timestamp ? new Date(timestamp).toTimeString().split(' ')[0] : new Date().toTimeString().split(' ')[0];
        const workEndTime = '17:00:00'; // Configurable
        
        // Calculate work hours
        const checkInDate = new Date(`1970-01-01T${record.checkIn}`);
        const checkOutDate = new Date(`1970-01-01T${checkOutTime}`);
        const workHours = (checkOutDate - checkInDate) / 3600000; // in hours
        
        // Calculate overtime
        const overtimeHours = workHours > 8 ? workHours - 8 : 0;
        
        // Check early leave
        const isEarlyLeave = checkOutTime < workEndTime;
        const earlyLeaveMinutes = isEarlyLeave ? Math.floor((new Date(`1970-01-01T${workEndTime}`) - new Date(`1970-01-01T${checkOutTime}`)) / 60000) : 0;
        
        record.checkOut = checkOutTime;
        record.workHours = parseFloat(workHours.toFixed(2));
        record.overtimeHours = parseFloat(overtimeHours.toFixed(2));
        record.isEarlyLeave = isEarlyLeave;
        record.earlyLeaveMinutes = earlyLeaveMinutes;
        record.status = 'completed';
        record.location = location;
        
        return record;
    }

    markAbsent(employeeId, date, reason = '') {
        const record = {
            id: 'ATT-' + Date.now(),
            employeeId,
            employeeName: this.getEmployeeFullName(employeeId),
            date: date,
            checkIn: null,
            checkOut: null,
            workHours: 0,
            overtimeHours: 0,
            isLate: false,
            lateMinutes: 0,
            isEarlyLeave: false,
            earlyLeaveMinutes: 0,
            status: 'absent',
            absenceReason: reason,
            companyId: companies.getCurrentCompany()?.id,
            createdAt: new Date().toISOString()
        };
        
        this.attendanceRecords.push(record);
        return record;
    }

    getAttendanceReport(employeeId, startDate, endDate) {
        const records = this.attendanceRecords.filter(r => 
            r.employeeId === employeeId &&
            r.date >= startDate &&
            r.date <= endDate
        ).sort((a, b) => a.date.localeCompare(b.date));
        
        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'completed').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const lateDays = records.filter(r => r.isLate).length;
        const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
        const totalOvertime = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
        const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
        
        return {
            employeeId,
            employeeName: this.getEmployeeFullName(employeeId),
            startDate,
            endDate,
            totalDays,
            presentDays,
            absentDays,
            lateDays,
            attendanceRate: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0,
            totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
            totalOvertime: parseFloat(totalOvertime.toFixed(2)),
            totalLateMinutes,
            records
        };
    }

    // ==================== Leave Management ====================
    
    async loadLeaves() {
        try {
            const response = await api.get('leaves');
            this.leaves = response.data || [];
        } catch (error) {
            console.error('Error loading leaves:', error);
            this.leaves = [];
        }
    }

    async requestLeave(leaveData) {
        const employee = this.employees.find(e => e.id === leaveData.employeeId);
        if (!employee) throw new Error('Employee not found');
        
        // Calculate leave days
        const startDate = new Date(leaveData.startDate);
        const endDate = new Date(leaveData.endDate);
        const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Check leave balance
        const leaveBalance = this.getLeaveBalance(leaveData.employeeId, leaveData.leaveType);
        if (leaveBalance < leaveDays && leaveData.leaveType !== 'unpaid') {
            throw new Error(`Insufficient leave balance. Available: ${leaveBalance}, Requested: ${leaveDays}`);
        }
        
        const leave = {
            id: 'LEAVE-' + Date.now(),
            employeeId: leaveData.employeeId,
            employeeName: this.getEmployeeFullName(leaveData.employeeId),
            leaveType: leaveData.leaveType, // annual, sick, emergency, unpaid, maternity, pilgrimage
            startDate: leaveData.startDate,
            endDate: leaveData.endDate,
            leaveDays,
            reason: leaveData.reason,
            status: 'pending', // pending, approved, rejected, cancelled
            submittedAt: new Date().toISOString(),
            approvedBy: null,
            approvedAt: null,
            rejectionReason: null,
            companyId: companies.getCurrentCompany()?.id,
            branchId: employee.branchId,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        this.leaves.push(leave);
        
        try {
            await api.post('leaves', leave);
            return leave;
        } catch (error) {
            console.error('Error requesting leave:', error);
            throw error;
        }
    }

    async approveLeave(leaveId, approverId) {
        const leave = this.leaves.find(l => l.id === leaveId);
        if (!leave) throw new Error('Leave request not found');
        
        if (leave.status !== 'pending') {
            throw new Error('Leave request is not pending');
        }
        
        leave.status = 'approved';
        leave.approvedBy = approverId;
        leave.approvedAt = new Date().toISOString();
        
        try {
            await api.put(`leaves/${leaveId}`, leave);
            return leave;
        } catch (error) {
            console.error('Error approving leave:', error);
            throw error;
        }
    }

    async rejectLeave(leaveId, reason, approverId) {
        const leave = this.leaves.find(l => l.id === leaveId);
        if (!leave) throw new Error('Leave request not found');
        
        if (leave.status !== 'pending') {
            throw new Error('Leave request is not pending');
        }
        
        leave.status = 'rejected';
        leave.rejectionReason = reason;
        leave.approvedBy = approverId;
        leave.approvedAt = new Date().toISOString();
        
        try {
            await api.put(`leaves/${leaveId}`, leave);
            return leave;
        } catch (error) {
            console.error('Error rejecting leave:', error);
            throw error;
        }
    }

    getLeaveBalance(employeeId, leaveType) {
        // Simplified logic - in production would calculate based on hire date, policy, etc.
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) return 0;
        
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1).toISOString();
        const yearEnd = new Date(currentYear, 11, 31).toISOString();
        
        // Annual leave entitlement (e.g., 21 days per year for Egypt)
        const annualEntitlement = 21;
        
        const usedLeaves = this.leaves.filter(l => 
            l.employeeId === employeeId &&
            l.leaveType === leaveType &&
            l.status === 'approved' &&
            l.startDate >= yearStart &&
            l.startDate <= yearEnd
        ).reduce((sum, l) => sum + l.leaveDays, 0);
        
        return annualEntitlement - usedLeaves;
    }

    getLeaveSummary(employeeId) {
        const currentYear = new Date().getFullYear();
        const yearStart = new Date(currentYear, 0, 1).toISOString();
        const yearEnd = new Date(currentYear, 11, 31).toISOString();
        
        const leaveTypes = ['annual', 'sick', 'emergency', 'unpaid'];
        const summary = {};
        
        leaveTypes.forEach(type => {
            const entitlement = type === 'annual' ? 21 : (type === 'sick' ? 14 : 0);
            const used = this.leaves.filter(l => 
                l.employeeId === employeeId &&
                l.leaveType === type &&
                l.status === 'approved' &&
                l.startDate >= yearStart &&
                l.startDate <= yearEnd
            ).reduce((sum, l) => sum + l.leaveDays, 0);
            
            summary[type] = {
                entitlement,
                used,
                balance: entitlement - used,
                pending: this.leaves.filter(l => 
                    l.employeeId === employeeId &&
                    l.leaveType === type &&
                    l.status === 'pending'
                ).reduce((sum, l) => sum + l.leaveDays, 0)
            };
        });
        
        return summary;
    }

    // ==================== Allowance & Deduction Types ====================
    
    async loadAllowanceTypes() {
        try {
            const response = await api.get('allowance-types');
            this.allowanceTypes = response.data || this.getDefaultAllowanceTypes();
        } catch (error) {
            console.error('Error loading allowance types:', error);
            this.allowanceTypes = this.getDefaultAllowanceTypes();
        }
    }

    getDefaultAllowanceTypes() {
        return [
            { id: 'ALL-001', code: 'HOUSING', nameEn: 'Housing Allowance', nameAr: 'بدل سكن', type: 'fixed', defaultValue: 0 },
            { id: 'ALL-002', code: 'TRANSPORT', nameEn: 'Transport Allowance', nameAr: 'بدل مواصلات', type: 'fixed', defaultValue: 0 },
            { id: 'ALL-003', code: 'PHONE', nameEn: 'Phone Allowance', nameAr: 'بدل هاتف', type: 'fixed', defaultValue: 0 },
            { id: 'ALL-004', code: 'MEAL', nameEn: 'Meal Allowance', nameAr: 'بدل طعام', type: 'fixed', defaultValue: 0 },
            { id: 'ALL-005', code: 'OVERTIME', nameEn: 'Overtime Pay', nameAr: 'أجر إضافي', type: 'variable', defaultValue: 0 },
            { id: 'ALL-006', code: 'COMMISSION', nameEn: 'Sales Commission', nameAr: 'عمولة مبيعات', type: 'variable', defaultValue: 0 },
            { id: 'ALL-007', code: 'BONUS', nameEn: 'Performance Bonus', nameAr: 'مكافأة أداء', type: 'variable', defaultValue: 0 }
        ];
    }

    async loadDeductionTypes() {
        try {
            const response = await api.get('deduction-types');
            this.deductionTypes = response.data || this.getDefaultDeductionTypes();
        } catch (error) {
            console.error('Error loading deduction types:', error);
            this.deductionTypes = this.getDefaultDeductionTypes();
        }
    }

    getDefaultDeductionTypes() {
        return [
            { id: 'DED-001', code: 'INSURANCE', nameEn: 'Social Insurance', nameAr: 'التأمين الاجتماعي', type: 'percentage', defaultValue: 14 },
            { id: 'DED-002', code: 'TAX', nameEn: 'Income Tax', nameAr: 'ضريبة الدخل', type: 'progressive', defaultValue: 0 },
            { id: 'DED-003', code: 'LOAN', nameEn: 'Loan Repayment', nameAr: 'سداد قرض', type: 'fixed', defaultValue: 0 },
            { id: 'DED-004', code: 'ABSENCE', nameEn: 'Absence Deduction', nameAr: 'خصم غياب', type: 'variable', defaultValue: 0 },
            { id: 'DED-005', code: 'PENALTY', nameEn: 'Disciplinary Penalty', nameAr: 'جزاء تأديبي', type: 'fixed', defaultValue: 0 },
            { id: 'DED-006', code: 'ADVANCE', nameEn: 'Salary Advance', nameAr: 'سلفة راتب', type: 'fixed', defaultValue: 0 }
        ];
    }

    // ==================== Payroll ====================
    
    async loadPayrolls() {
        try {
            const response = await api.get('payrolls');
            this.payrolls = response.data || [];
        } catch (error) {
            console.error('Error loading payrolls:', error);
            this.payrolls = [];
        }
    }

    generatePayroll(employeeId, periodStart, periodEnd) {
        const employee = this.employees.find(e => e.id === employeeId);
        if (!employee) throw new Error('Employee not found');
        
        // Get attendance data for the period
        const attendanceReport = this.getAttendanceReport(employeeId, periodStart, periodEnd);
        
        // Calculate allowances
        const allowances = this.calculateAllowances(employee, attendanceReport, periodStart, periodEnd);
        
        // Calculate deductions
        const deductions = this.calculateDeductions(employee, attendanceReport, periodStart, periodEnd);
        
        // Calculate gross and net salary
        const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
        const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
        
        const grossSalary = employee.basicSalary + totalAllowances;
        const netSalary = grossSalary - totalDeductions;
        
        const payroll = {
            id: 'PAYROLL-' + Date.now(),
            payrollNumber: this.generatePayrollNumber(),
            employeeId,
            employeeName: this.getEmployeeFullName(employeeId),
            periodStart,
            periodEnd,
            paymentDate: new Date(periodEnd).toISOString(),
            
            // Earnings
            basicSalary: employee.basicSalary,
            allowances,
            totalAllowances,
            grossSalary,
            
            // Deductions
            deductions,
            totalDeductions,
            
            // Net
            netSalary,
            currency: employee.currency,
            
            // Payment
            paymentMethod: 'bank_transfer',
            bankAccountId: employee.bankAccountId,
            bankAccountNumber: employee.bankAccountNumber,
            paymentStatus: 'pending', // pending, paid, cancelled
            paidAt: null,
            
            // Working days
            totalWorkingDays: attendanceReport.totalDays,
            presentDays: attendanceReport.presentDays,
            absentDays: attendanceReport.absentDays,
            overtimeHours: attendanceReport.totalOvertime,
            lateMinutes: attendanceReport.totalLateMinutes,
            
            companyId: companies.getCurrentCompany()?.id,
            branchId: employee.branchId,
            createdAt: new Date().toISOString(),
            createdBy: auth.getCurrentUser()?.email
        };
        
        return payroll;
    }

    calculateAllowances(employee, attendanceReport, periodStart, periodEnd) {
        const allowances = [];
        
        // Housing Allowance (example: 20% of basic)
        const housingAmount = employee.basicSalary * 0.20;
        allowances.push({
            typeId: 'ALL-001',
            typeCode: 'HOUSING',
            nameEn: 'Housing Allowance',
            nameAr: 'بدل سكن',
            amount: housingAmount,
            calculation: '20% of basic salary'
        });
        
        // Transport Allowance (example: 10% of basic)
        const transportAmount = employee.basicSalary * 0.10;
        allowances.push({
            typeId: 'ALL-002',
            typeCode: 'TRANSPORT',
            nameEn: 'Transport Allowance',
            nameAr: 'بدل مواصلات',
            amount: transportAmount,
            calculation: '10% of basic salary'
        });
        
        // Overtime Pay
        if (attendanceReport.totalOvertime > 0) {
            const hourlyRate = employee.basicSalary / 22 / 8; // Assuming 22 working days, 8 hours/day
            const overtimeRate = hourlyRate * 1.5; // 150% for overtime
            const overtimeAmount = overtimeRate * attendanceReport.totalOvertime;
            
            allowances.push({
                typeId: 'ALL-005',
                typeCode: 'OVERTIME',
                nameEn: 'Overtime Pay',
                nameAr: 'أجر إضافي',
                amount: overtimeAmount,
                calculation: `${attendanceReport.totalOvertime} hours × ${overtimeRate.toFixed(2)}`
            });
        }
        
        return allowances;
    }

    calculateDeductions(employee, attendanceReport, periodStart, periodEnd) {
        const deductions = [];
        
        // Social Insurance (14% of basic, capped)
        const insuranceBase = Math.min(employee.basicSalary, 9800); // Cap as per Egyptian law
        const insuranceAmount = insuranceBase * 0.14;
        deductions.push({
            typeId: 'DED-001',
            typeCode: 'INSURANCE',
            nameEn: 'Social Insurance',
            nameAr: 'التأمين الاجتماعي',
            amount: insuranceAmount,
            calculation: '14% of basic (capped)'
        });
        
        // Absence Deduction
        if (attendanceReport.absentDays > 0) {
            const dailyRate = employee.basicSalary / 22;
            const absenceAmount = dailyRate * attendanceReport.absentDays;
            
            deductions.push({
                typeId: 'DED-004',
                typeCode: 'ABSENCE',
                nameEn: 'Absence Deduction',
                nameAr: 'خصم غياب',
                amount: absenceAmount,
                calculation: `${attendanceReport.absentDays} days × ${dailyRate.toFixed(2)}`
            });
        }
        
        // Late Deduction (example: deduct for excessive lateness)
        if (attendanceReport.totalLateMinutes > 60) {
            const hourlyRate = employee.basicSalary / 22 / 8;
            const excessLateMinutes = attendanceReport.totalLateMinutes - 60; // First hour forgiven
            const lateAmount = (excessLateMinutes / 60) * hourlyRate;
            
            deductions.push({
                typeId: 'DED-005',
                typeCode: 'PENALTY',
                nameEn: 'Late Penalty',
                nameAr: 'خصم تأخير',
                amount: lateAmount,
                calculation: `${excessLateMinutes} minutes late`
            });
        }
        
        return deductions;
    }

    generatePayrollNumber() {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const count = this.payrolls.filter(p => 
            p.payrollNumber?.startsWith(`SAL-${year}-${String(month).padStart(2, '0')}`)
        ).length + 1;
        return `SAL-${year}-${String(month).padStart(2, '0')}-${String(count).padStart(4, '0')}`;
    }

    async processPayroll(payrollId) {
        const payroll = this.payrolls.find(p => p.id === payrollId);
        if (!payroll) throw new Error('Payroll not found');
        
        if (payroll.paymentStatus !== 'pending') {
            throw new Error('Payroll is not pending payment');
        }
        
        payroll.paymentStatus = 'paid';
        payroll.paidAt = new Date().toISOString();
        
        // Generate accounting entry
        this.generatePayrollAccountingEntry(payroll);
        
        try {
            await api.put(`payrolls/${payrollId}`, payroll);
            return payroll;
        } catch (error) {
            console.error('Error processing payroll:', error);
            throw error;
        }
    }

    generatePayrollAccountingEntry(payroll) {
        // Create journal entry for payroll
        const entryData = {
            date: payroll.paymentDate,
            description: `Payroll ${payroll.payrollNumber} - ${payroll.employeeName}`,
            referenceType: 'payroll',
            referenceId: payroll.id,
            lines: [
                // Debit: Salary Expense
                {
                    accountId: '5200',
                    debit: payroll.grossSalary,
                    credit: 0,
                    description: 'Gross Salary'
                },
                // Credit: Social Insurance Payable
                {
                    accountId: '2120',
                    debit: 0,
                    credit: payroll.totalDeductions,
                    description: 'Deductions'
                },
                // Credit: Cash/Bank (Net Salary)
                {
                    accountId: payroll.paymentMethod === 'bank_transfer' ? '1120' : '1110',
                    debit: 0,
                    credit: payroll.netSalary,
                    description: 'Net Salary Payment'
                }
            ],
            status: 'draft'
        };
        
        const entry = accounting.createJournalEntry(entryData);
        // In production, save to journal entries
    }

    getPayrollSummary(periodStart, periodEnd) {
        const payrolls = this.payrolls.filter(p => 
            p.periodStart >= periodStart &&
            p.periodEnd <= periodEnd
        );
        
        const totalEmployees = payrolls.length;
        const totalGross = payrolls.reduce((sum, p) => sum + p.grossSalary, 0);
        const totalAllowances = payrolls.reduce((sum, p) => sum + p.totalAllowances, 0);
        const totalDeductions = payrolls.reduce((sum, p) => sum + p.totalDeductions, 0);
        const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
        const paidCount = payrolls.filter(p => p.paymentStatus === 'paid').length;
        const pendingCount = payrolls.filter(p => p.paymentStatus === 'pending').length;
        
        return {
            periodStart,
            periodEnd,
            totalEmployees,
            totalGross,
            totalAllowances,
            totalDeductions,
            totalNet,
            paidCount,
            pendingCount,
            payrolls
        };
    }
}

// Initialize module
const hr = new HRModule();
