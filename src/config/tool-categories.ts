/**
 * Tool category configuration for Shopify GraphQL MCP
 * 
 * Tools are organized into categories. Users can enable/disable categories
 * via environment variables using boolean flags.
 * 
 * Examples:
 *   ENABLE_ESSENTIAL=true                 # Enable essential category
 *   ENABLE_COMMERCE=true                   # Enable commerce category
 *   ENABLE_MARKETING=false                 # Disable marketing category
 *   
 *   Or use the legacy comma-separated format:
 *   ENABLED_TOOL_CATEGORIES=essential,commerce
 *   ENABLED_TOOL_CATEGORIES=all           # Enable all categories
 *   ENABLED_TOOL_CATEGORIES=none          # Disable all categories
 */

export type ToolCategory = 
  | 'essential'
  | 'commerce'
  | 'marketing'
  | 'content'
  | 'advanced'
  | 'reporting'
  | 'automation';

export interface CategoryConfig {
  name: ToolCategory;
  description: string;
  toolCount: number;
  modules: string[];
}

/**
 * Essential tools - core e-commerce operations (~35 tools)
 * These are enabled by default for most users
 */
export const ESSENTIAL_CATEGORIES: CategoryConfig = {
  name: 'essential',
  description: 'Core e-commerce operations: products, orders, customers, inventory, collections',
  toolCount: 35,
  modules: [
    'shop',
    'products',
    'orders',
    'customers',
    'collections',
    'inventory',
    'locations',
    'draft-orders',
    'discounts',
    'fulfillments',
  ],
};

/**
 * Commerce tools - extended commerce features (~55 tools)
 */
export const COMMERCE_CATEGORIES: CategoryConfig = {
  name: 'commerce',
  description: 'Extended commerce: gift cards, returns, checkouts, payments, store credit, subscriptions',
  toolCount: 55,
  modules: [
    'gift-cards',
    'returns',
    'checkouts',
    'payment-terms',
    'payment-customizations',
    'shopify-payments',
    'order-edits',
    'companies',
    'cash-tracking',
    'store-credit',
    'subscriptions',
    'fulfillment-constraints',
    'delivery-customizations',
    'delivery-option-generators',
    'custom-fulfillment-services',
  ],
};

/**
 * Marketing tools - marketing and promotional features (~20 tools)
 */
export const MARKETING_CATEGORIES: CategoryConfig = {
  name: 'marketing',
  description: 'Marketing: campaigns, markets, channels, discovery, price rules',
  toolCount: 20,
  modules: [
    'marketing-campaigns',
    'markets',
    'channels',
    'discovery',
    'price-rules',
    'analytics',
    'pixels',
    'publications',
  ],
};

/**
 * Content tools - store content and theming (~25 tools)
 */
export const CONTENT_CATEGORIES: CategoryConfig = {
  name: 'content',
  description: 'Content: pages, navigation, themes, files, metaobjects, translations',
  toolCount: 25,
  modules: [
    'pages',
    'navigation',
    'themes',
    'files',
    'metaobjects',
    'translations',
    'locales',
    'legal-policies',
  ],
};

/**
 * Advanced tools - complex/technical features (~20 tools)
 */
export const ADVANCED_CATEGORIES: CategoryConfig = {
  name: 'advanced',
  description: 'Advanced: cart transforms, validations, audit events, custom pixels, scripts',
  toolCount: 20,
  modules: [
    'cart-transforms',
    'validations',
    'audit-events',
    'custom-pixels',
    'script-tags',
    'customer-data-erasure',
    'customer-merge',
    'customer-payment-methods',
    'privacy-settings',
    'shipping',
    'product-listings',
  ],
};

/**
 * Reporting tools - reports and feedback (~15 tools)
 */
export const REPORTING_CATEGORIES: CategoryConfig = {
  name: 'reporting',
  description: 'Reporting: reports, resource feedbacks, apps',
  toolCount: 15,
  modules: [
    'reports',
    'resource-feedbacks',
    'apps',
  ],
};

/**
 * Automation tools - inventory automation (~15 tools)
 */
export const AUTOMATION_CATEGORIES: CategoryConfig = {
  name: 'automation',
  description: 'Automation: inventory shipments, transfers, packing slips',
  toolCount: 15,
  modules: [
    'inventory-shipments',
    'inventory-transfers',
    'packing-slip-templates',
  ],
};

export const ALL_CATEGORIES: CategoryConfig[] = [
  ESSENTIAL_CATEGORIES,
  COMMERCE_CATEGORIES,
  MARKETING_CATEGORIES,
  CONTENT_CATEGORIES,
  ADVANCED_CATEGORIES,
  REPORTING_CATEGORIES,
  AUTOMATION_CATEGORIES,
];

/**
 * Parse environment variables to determine enabled categories
 * 
 * Supports two formats:
 * 1. Boolean flags: ENABLE_<CATEGORY>=true/false (new approach)
 * 2. Legacy comma-separated: ENABLED_TOOL_CATEGORIES=essential,commerce
 * 
 * Boolean flags take precedence if set. If no boolean flags are set,
 * falls back to legacy format for backward compatibility.
 */
export function getEnabledCategories(): string[] {
  const enabled: string[] = [];
  
  // Check for boolean flags first (new approach)
  // Format: ENABLE_ESSENTIAL=true, ENABLE_COMMERCE=false, etc.
  for (const category of ALL_CATEGORIES) {
    const envVar = `ENABLE_${category.name.toUpperCase()}`;
    const value = process.env[envVar];
    
    if (value !== undefined) {
      // Boolean flag is explicitly set
      if (value.toLowerCase() === 'true') {
        enabled.push(category.name);
      }
      // If 'false', don't add to enabled list
    }
  }
  
  // If any boolean flags were set, return only those
  if (ALL_CATEGORIES.some(c => process.env[`ENABLE_${c.name.toUpperCase()}`] !== undefined)) {
    return enabled;
  }
  
  // Fall back to legacy comma-separated format
  const envValue = process.env.ENABLED_TOOL_CATEGORIES?.toLowerCase().trim();
  
  if (!envValue || envValue === 'all') {
    return ALL_CATEGORIES.map(c => c.name);
  }
  
  if (envValue === 'none') {
    return [];
  }
  
  // Parse comma-separated list
  const requested = envValue.split(',').map(s => s.trim()).filter(Boolean);
  
  // Validate categories
  const validCategories = ALL_CATEGORIES.map(c => c.name);
  const invalid = requested.filter(r => !validCategories.includes(r as ToolCategory));
  
  if (invalid.length > 0) {
    console.error(`[WARN] Invalid tool categories: ${invalid.join(', ')}`);
    console.error(`[WARN] Valid categories: ${validCategories.join(', ')}`);
  }
  
  return requested.filter(r => validCategories.includes(r as ToolCategory));
}

/**
 * Get category configuration by name
 */
export function getCategoryConfig(name: string): CategoryConfig | undefined {
  return ALL_CATEGORIES.find(c => c.name === name);
}

/**
 * Get total tool count for enabled categories
 */
export function getEnabledToolCount(enabledCategories: string[]): number {
  if (enabledCategories.length === 0) return 0;
  
  return enabledCategories.reduce((total, catName) => {
    const cat = getCategoryConfig(catName);
    return total + (cat?.toolCount || 0);
  }, 0);
}
