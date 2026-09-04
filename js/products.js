/**
 * FINOVATE ERP X - Products Module
 * Phase 05: Product & Inventory Management
 */

const ProductsModule = {
  // Initialize module
  async init() {
    console.log('Products Module: Initializing...');
    await this.loadProducts();
    return { status: 'success' };
  },

  // Get all products
  async getAllProducts(companyId = null) {
    const filters = {};
    if (companyId) filters.companyId = companyId;
    
    const products = await DBService.find('Products', filters);
    return products.filter(p => p.status !== 'deleted');
  },

  // Get product by ID
  async getProduct(productId) {
    return DBService.findOne('Products', 'id', productId);
  },

  // Get product by SKU
  async getProductBySKU(sku) {
    return DBService.findOne('Products', 'sku', sku);
  },

  // Get product by barcode
  async getProductByBarcode(barcode) {
    return DBService.findOne('Products', 'barcode', barcode);
  },

  // Create new product
  async createProduct(data) {
    const companyId = CompaniesModule.getCurrentCompany()?.id || data.companyId;
    
    if (!companyId) {
      return { status: 'error', message: 'Company ID is required' };
    }

    // Check if product already exists
    if (data.sku) {
      const existing = await this.getProductBySKU(data.sku);
      if (existing) {
        return { status: 'error', message: 'Product with this SKU already exists' };
      }
    }

    if (data.barcode) {
      const existing = await this.getProductByBarcode(data.barcode);
      if (existing) {
        return { status: 'error', message: 'Product with this barcode already exists' };
      }
    }

    const productData = {
      id: DBService.generateId('PROD'),
      companyId,
      sku: data.sku || this.generateSKU(),
      barcode: data.barcode || '',
      name: data.name,
      nameAr: data.nameAr || '',
      nameEn: data.nameEn || '',
      description: data.description || '',
      categoryId: data.categoryId || '',
      brandId: data.brandId || '',
      unitId: data.unitId || 'piece',
      type: data.type || 'product', // product, service, bundle
      trackInventory: data.trackInventory !== false,
      trackBatch: data.trackBatch || false,
      trackSerial: data.trackSerial || false,
      
      // Pricing
      costPrice: parseFloat(data.costPrice) || 0,
      sellingPrice: parseFloat(data.sellingPrice) || 0,
      wholesalePrice: parseFloat(data.wholesalePrice) || 0,
      retailPrice: parseFloat(data.retailPrice) || 0,
      currency: data.currency || 'USD',
      taxRate: parseFloat(data.taxRate) || 0,
      
      // Inventory
      minStock: parseFloat(data.minStock) || 0,
      maxStock: parseFloat(data.maxStock) || 0,
      reorderPoint: parseFloat(data.reorderPoint) || 0,
      initialStock: parseFloat(data.initialStock) || 0,
      
      // Physical properties
      weight: parseFloat(data.weight) || 0,
      weightUnit: data.weightUnit || 'kg',
      length: parseFloat(data.length) || 0,
      width: parseFloat(data.width) || 0,
      height: parseFloat(data.height) || 0,
      dimensionUnit: data.dimensionUnit || 'cm',
      
      // Images
      images: JSON.stringify(data.images || []),
      primaryImage: data.primaryImage || '',
      
      // Status
      status: data.status || 'active', // active, inactive, discontinued
      isFeatured: data.isFeatured || false,
      isPopular: data.isPopular || false,
      
      // Metadata
      tags: data.tags || [],
      notes: data.notes || '',
      manufacturer: data.manufacturer || '',
      supplierId: data.supplierId || '',
      warranty: data.warranty || '',
      warrantyPeriod: parseInt(data.warrantyPeriod) || 0,
      
      createdAt: new Date().toISOString(),
      createdBy: AuthModule.currentUser?.email || ''
    };

    const result = await DBService.insert('Products', productData);
    
    if (result.status === 'success') {
      await this.logActivity(productData.id, 'created', 'Product created');
      
      // Create initial stock record if initialStock > 0
      if (productData.trackInventory && productData.initialStock > 0) {
        await this.createInitialStock(productData.id, productData.initialStock);
      }
    }
    
    return result;
  },

  // Update product
  async updateProduct(productId, data) {
    const product = await this.getProduct(productId);
    
    if (!product) {
      return { status: 'error', message: 'Product not found' };
    }

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== product.sku) {
      const existing = await this.getProductBySKU(data.sku);
      if (existing && existing.id !== productId) {
        return { status: 'error', message: 'Product with this SKU already exists' };
      }
    }

    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: AuthModule.currentUser?.email || ''
    };

    const result = await DBService.update('Products', 'id', productId, updateData);
    
    if (result.status === 'success') {
      await this.logActivity(productId, 'updated', 'Product updated');
    }
    
    return result;
  },

  // Delete product (soft delete)
  async deleteProduct(productId) {
    const result = await DBService.update('Products', 'id', productId, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: AuthModule.currentUser?.email || ''
    });
    
    if (result.status === 'success') {
      await this.logActivity(productId, 'deleted', 'Product deleted');
    }
    
    return result;
  },

  // Create initial stock record
  async createInitialStock(productId, quantity) {
    const warehouseId = data.warehouseId || 'main';
    
    const stockData = {
      id: DBService.generateId('STK'),
      productId,
      warehouseId,
      quantity: parseFloat(quantity),
      reservedQuantity: 0,
      availableQuantity: parseFloat(quantity),
      batchNumber: null,
      serialNumber: null,
      expiryDate: null,
      lastCountedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return DBService.insert('Stock', stockData);
  },

  // Get product stock across all warehouses
  async getProductStock(productId) {
    const stockRecords = await DBService.find('Stock', { productId });
    
    let totalQuantity = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    
    stockRecords.forEach(stock => {
      totalQuantity += parseFloat(stock.quantity) || 0;
      totalReserved += parseFloat(stock.reservedQuantity) || 0;
      totalAvailable += parseFloat(stock.availableQuantity) || 0;
    });
    
    return {
      productId,
      totalQuantity,
      totalReserved,
      totalAvailable,
      warehouses: stockRecords
    };
  },

  // Check product availability
  async checkAvailability(productId, quantity, warehouseId = null) {
    const filters = { productId };
    if (warehouseId) filters.warehouseId = warehouseId;
    
    const stockRecords = await DBService.find('Stock', filters);
    
    let totalAvailable = 0;
    stockRecords.forEach(stock => {
      totalAvailable += parseFloat(stock.availableQuantity) || 0;
    });
    
    return {
      productId,
      requestedQuantity: parseFloat(quantity),
      availableQuantity: totalAvailable,
      isAvailable: totalAvailable >= quantity,
      shortage: totalAvailable >= quantity ? 0 : quantity - totalAvailable
    };
  },

  // Search products
  async searchProducts(query, companyId = null) {
    const products = await this.getAllProducts(companyId);
    
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.nameAr && p.nameAr.includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())) ||
      (p.barcode && p.barcode.includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
    );
  },

  // Get product categories
  async getCategories(companyId = null) {
    const filters = {};
    if (companyId) filters.companyId = companyId;
    
    const categories = await DBService.find('Categories', filters);
    return categories.filter(c => c.status !== 'deleted');
  },

  // Create category
  async createCategory(data) {
    const companyId = CompaniesModule.getCurrentCompany()?.id || data.companyId;
    
    const categoryData = {
      id: DBService.generateId('CAT'),
      companyId,
      code: data.code || this.generateCode(),
      name: data.name,
      nameAr: data.nameAr || '',
      nameEn: data.nameEn || '',
      description: data.description || '',
      parentId: data.parentId || null,
      level: data.level || 1,
      imagePath: data.imagePath || '',
      sortOrder: parseInt(data.sortOrder) || 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    return DBService.insert('Categories', categoryData);
  },

  // Log product activity
  async logActivity(productId, action, description) {
    const activity = {
      id: DBService.generateId('ACT'),
      entityType: 'Product',
      entityId: productId,
      action,
      description,
      userId: AuthModule.currentUser?.email || '',
      userName: AuthModule.currentUser?.name || '',
      timestamp: new Date().toISOString()
    };
    
    return DBService.insert('ProductActivities', activity);
  },

  // Generate SKU
  generateSKU() {
    const prefix = 'PRD';
    const timestamp = new Date().getTime().toString(36);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}${random}`;
  },

  // Generate code
  generateCode() {
    const timestamp = new Date().getTime().toString(36);
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `CAT-${timestamp}${random}`;
  },

  // Load products into cache
  async loadProducts() {
    const companyId = CompaniesModule.getCurrentCompany()?.id;
    if (companyId) {
      await this.getAllProducts(companyId);
    }
  },

  // Export products to CSV
  async exportToCSV() {
    const products = await this.getAllProducts();
    
    const headers = ['SKU', 'Name', 'Barcode', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Status'];
    const rows = products.map(p => {
      const stock = this.getProductStock(p.id);
      return [
        p.sku,
        p.name,
        p.barcode || '',
        p.categoryId || '',
        p.costPrice,
        p.sellingPrice,
        stock.totalAvailable || 0,
        p.status
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return { status: 'success', message: 'Products exported successfully' };
  },

  // Get low stock products
  async getLowStockProducts() {
    const products = await this.getAllProducts();
    
    const lowStockProducts = [];
    
    for (const product of products) {
      if (product.trackInventory) {
        const stock = await this.getProductStock(product.id);
        
        if (stock.totalAvailable <= product.minStock) {
          lowStockProducts.push({
            ...product,
            currentStock: stock.totalAvailable,
            minStock: product.minStock,
            shortage: product.minStock - stock.totalAvailable
          });
        }
      }
    }
    
    return lowStockProducts;
  },

  // Get product valuation
  async getProductValuation() {
    const products = await this.getAllProducts();
    
    let totalValue = 0;
    const valuations = [];
    
    for (const product of products) {
      const stock = await this.getProductStock(product.id);
      const value = stock.totalQuantity * product.costPrice;
      totalValue += value;
      
      valuations.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: stock.totalQuantity,
        costPrice: product.costPrice,
        totalValue: value
      });
    }
    
    return {
      totalValue,
      products: valuations,
      currency: 'USD'
    };
  }
};

// Initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    ProductsModule.init();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductsModule;
}
