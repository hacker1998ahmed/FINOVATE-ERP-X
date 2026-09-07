/**
 * FINOVATE ERP X - Charts Utility Library
 * Lightweight charting functions for data visualization
 */

const Charts = {
  // Color palette
  colors: {
    primary: '#5260dc',
    success: '#17a673',
    warning: '#e99635',
    danger: '#e55d78',
    info: '#4e7bd0',
    muted: '#70809a'
  },

  /**
   * Create a simple bar chart using CSS
   * @param {string} containerId - ID of the container element
   * @param {Array} data - Array of {label, value, color} objects
   */
  createBarChart(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxValue = Math.max(...data.map(d => d.value));
    
    let html = '<div class="bar-chart">';
    data.forEach(item => {
      const heightPercent = (item.value / maxValue) * 100;
      html += `
        <div class="bar-item">
          <div class="bar" style="height: ${heightPercent}%; background: ${item.color || this.colors.primary}"></div>
          <div class="bar-label">${item.label}</div>
          <div class="bar-value">${this.formatNumber(item.value)}</div>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
  },

  /**
   * Create a line chart using SVG
   * @param {string} containerId - ID of the container element
   * @param {Array} data - Array of values
   * @param {Object} options - Chart options
   */
  createLineChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.offsetWidth || 400;
    const height = container.offsetHeight || 200;
    const padding = 40;
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <!-- Grid lines -->
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#e9edf5" stroke-width="1"/>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#e9edf5" stroke-width="1"/>
        
        <!-- Line -->
        <polyline points="${points}" fill="none" stroke="${options.color || this.colors.primary}" stroke-width="2"/>
        
        <!-- Data points -->
        ${data.map((value, index) => {
          const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
          return `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="${options.color || this.colors.primary}" stroke-width="2"/>`;
        }).join('')}
      </svg>
    `;
    
    container.innerHTML = svg;
  },

  /**
   * Create a pie/doughut chart using SVG
   * @param {string} containerId - ID of the container element
   * @param {Array} data - Array of {label, value, color} objects
   */
  createPieChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = Math.min(container.offsetWidth || 300, container.offsetHeight || 300);
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 40;
    const innerRadius = options.doughnut ? radius * 0.6 : 0;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90;
    
    let paths = '';
    data.forEach(item => {
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      if (innerRadius > 0) {
        const x3 = centerX + innerRadius * Math.cos(endRad);
        const y3 = centerY + innerRadius * Math.sin(endRad);
        const x4 = centerX + innerRadius * Math.cos(startRad);
        const y4 = centerY + innerRadius * Math.sin(startRad);
        
        paths += `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z" fill="${item.color || this.colors.primary}"/>`;
      } else {
        paths += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${item.color || this.colors.primary}"/>`;
      }
      
      currentAngle = endAngle;
    });

    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${paths}
      </svg>
    `;
    
    container.innerHTML = svg;
  },

  /**
   * Create a horizontal progress bar
   * @param {string} containerId - ID of the container element
   * @param {number} value - Current value
   * @param {number} max - Maximum value
   * @param {string} color - Bar color
   */
  createProgressBar(containerId, value, max, color = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    container.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%; background: ${color || this.colors.primary}"></div>
      </div>
      <div class="progress-labels">
        <span>${this.formatNumber(value)}</span>
        <span>${this.formatNumber(max)}</span>
      </div>
    `;
  },

  /**
   * Format number with locale
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  /**
   * Generate random color from palette
   * @returns {string} Random color hex code
   */
  randomColor() {
    const palette = Object.values(this.colors);
    return palette[Math.floor(Math.random() * palette.length)];
  }
};

// Auto-initialize charts on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize any chart containers with data attributes
  document.querySelectorAll('[data-chart-type]').forEach(container => {
    const chartType = container.dataset.chartType;
    const data = JSON.parse(container.dataset.chartData || '[]');
    
    switch(chartType) {
      case 'bar':
        Charts.createBarChart(container.id, data);
        break;
      case 'line':
        Charts.createLineChart(container.id, data);
        break;
      case 'pie':
        Charts.createPieChart(container.id, data);
        break;
    }
  });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Charts;
}
