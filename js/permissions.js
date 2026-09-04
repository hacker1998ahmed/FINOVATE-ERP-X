/**
 * FINOVATE ERP X - Permissions Module
 * Role-Based Access Control (RBAC) System
 */

const PermissionsModule = {
  // Permission types
  PERMISSIONS: {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
    APPROVE: 'approve',
    REJECT: 'reject',
    POST: 'post',
    UNPOST: 'unpost',
    PRINT: 'print',
    EXPORT: 'export',
    IMPORT: 'import',
    SHARE: 'share',
    CLOSE: 'close',
    REOPEN: 'reopen'
  },
  
  // Default roles with permissions
  defaultRoles: {
    admin: {
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['*'] // All permissions
    },
    manager: {
      name: 'Manager',
      description: 'Management access',
      permissions: [
        'view', 'create', 'edit', 'approve', 'print', 'export', 'share'
      ]
    },
    accountant: {
      name: 'Accountant',
      description: 'Accounting operations',
      permissions: [
        'view', 'create', 'edit', 'post', 'print', 'export'
      ]
    },
    user: {
      name: 'User',
      description: 'Basic user access',
      permissions: [
        'view', 'print'
      ]
    }
  },
  
  // Module-level permissions
  modulePermissions: {
    dashboard: ['view'],
    companies: ['view', 'create', 'edit', 'delete'],
    branches: ['view', 'create', 'edit', 'delete'],
    customers: ['view', 'create', 'edit', 'delete'],
    suppliers: ['view', 'create', 'edit', 'delete'],
    products: ['view', 'create', 'edit', 'delete'],
    inventory: ['view', 'create', 'edit', 'delete', 'post'],
    sales: ['view', 'create', 'edit', 'delete', 'approve', 'post', 'print'],
    purchasing: ['view', 'create', 'edit', 'delete', 'approve', 'post'],
    accounting: ['view', 'create', 'edit', 'post', 'print', 'export'],
    cash: ['view', 'create', 'edit', 'post', 'print'],
    banks: ['view', 'create', 'edit', 'post', 'print'],
    hr: ['view', 'create', 'edit', 'delete'],
    payroll: ['view', 'create', 'edit', 'post', 'print'],
    reports: ['view', 'export', 'print'],
    settings: ['view', 'edit']
  },
  
  // Initialize module
  async init() {
    console.log('Permissions Module: Initializing...');
    await this.loadRoles();
    return { status: 'success' };
  },
  
  // Load roles from database
  async loadRoles() {
    const roles = await DBService.findAll('Roles');
    
    if (roles.length === 0) {
      // Create default roles
      for (const [roleKey, roleData] of Object.entries(this.defaultRoles)) {
        await DBService.insert('Roles', {
          id: roleKey,
          name: roleData.name,
          description: roleData.description,
          permissions: JSON.stringify(roleData.permissions),
          createdAt: new Date().toISOString()
        });
      }
    }
  },
  
  // Get all roles
  async getRoles() {
    return DBService.findAll('Roles');
  },
  
  // Get role by ID
  async getRole(roleId) {
    return DBService.findOne('Roles', 'id', roleId);
  },
  
  // Create new role
  async createRole(data) {
    const roleData = {
      id: data.id || this.generateRoleId(),
      name: data.name,
      description: data.description || '',
      permissions: JSON.stringify(data.permissions || []),
      createdAt: new Date().toISOString()
    };
    
    return DBService.insert('Roles', roleData);
  },
  
  // Update role
  async updateRole(roleId, data) {
    const updateData = { ...data };
    
    if (data.permissions) {
      updateData.permissions = JSON.stringify(data.permissions);
    }
    
    return DBService.update('Roles', 'id', roleId, updateData);
  },
  
  // Delete role
  async deleteRole(roleId) {
    // Prevent deleting default roles
    if (this.defaultRoles[roleId]) {
      return { 
        status: 'error', 
        message: 'Cannot delete default roles' 
      };
    }
    
    return DBService.delete('Roles', 'id', roleId);
  },
  
  // Check if user has permission
  hasPermission(userRole, permission, module = null) {
    const role = this.defaultRoles[userRole];
    
    if (!role) return false;
    
    // Admin has all permissions
    if (role.permissions.includes('*')) return true;
    
    // Check specific permission
    if (role.permissions.includes(permission)) {
      // If module specified, check module permissions
      if (module && this.modulePermissions[module]) {
        return this.modulePermissions[module].includes(permission);
      }
      return true;
    }
    
    return false;
  },
  
  // Check if user can perform action on module
  can(userRole, module, action) {
    return this.hasPermission(userRole, action, module);
  },
  
  // Get user permissions for a module
  getUserModulePermissions(userRole, module) {
    const role = this.defaultRoles[userRole];
    
    if (!role) return [];
    
    if (role.permissions.includes('*')) {
      return this.modulePermissions[module] || [];
    }
    
    const modulePerms = this.modulePermissions[module] || [];
    return modulePerms.filter(p => role.permissions.includes(p));
  },
  
  // Generate role ID
  generateRoleId() {
    return 'role_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  },
  
  // Get all available permissions
  getAllPermissions() {
    return Object.values(this.PERMISSIONS);
  },
  
  // Get all modules
  getAllModules() {
    return Object.keys(this.modulePermissions);
  },
  
  // Validate permissions array
  validatePermissions(permissions) {
    const validPermissions = this.getAllPermissions();
    return permissions.every(p => p === '*' || validPermissions.includes(p));
  }
};

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    PermissionsModule.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PermissionsModule;
}
