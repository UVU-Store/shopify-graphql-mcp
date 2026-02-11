import { ToolDefinition } from "../types/index.js";

// Tool definitions mapped from TOOLS.md scopes
export const toolDefinitions: ToolDefinition[] = [
  // Orders
  { name: "get_orders", description: "Fetch orders from the Shopify store with optional filtering", scope: "read_all_orders", category: "orders" },
  { name: "get_order", description: "Fetch a specific order by ID", scope: "read_all_orders", category: "orders" },
  { name: "create_order", description: "Create a new order in the Shopify store", scope: "write_draft_orders", category: "orders" },
  { name: "update_order", description: "Update an existing order", scope: "write_draft_orders", category: "orders" },
  { name: "delete_order", description: "Delete an order from the store", scope: "write_draft_orders", category: "orders" },
  
  // Products
  { name: "get_products", description: "Fetch products from the Shopify store with optional filtering", scope: "read_products", category: "products" },
  { name: "get_product", description: "Fetch a specific product by ID", scope: "read_products", category: "products" },
  { name: "create_product", description: "Create a new product in the Shopify store", scope: "write_products", category: "products" },
  { name: "update_product", description: "Update an existing product", scope: "write_products", category: "products" },
  { name: "delete_product", description: "Delete a product from the store", scope: "write_products", category: "products" },
  
  // Customers
  { name: "get_customers", description: "Fetch customers from the Shopify store with optional filtering", scope: "read_customers", category: "customers" },
  { name: "get_customer", description: "Fetch a specific customer by ID", scope: "read_customers", category: "customers" },
  { name: "create_customer", description: "Create a new customer in the Shopify store", scope: "write_customers", category: "customers" },
  { name: "update_customer", description: "Update an existing customer", scope: "write_customers", category: "customers" },
  { name: "delete_customer", description: "Delete a customer from the store", scope: "write_customers", category: "customers" },
  
  // Collections
  { name: "get_collections", description: "Fetch collections from the Shopify store", scope: "read_products", category: "collections" },
  { name: "get_collection", description: "Fetch a specific collection by ID", scope: "read_products", category: "collections" },
  { name: "create_collection", description: "Create a new collection", scope: "write_products", category: "collections" },
  { name: "update_collection", description: "Update an existing collection", scope: "write_products", category: "collections" },
  { name: "delete_collection", description: "Delete a collection", scope: "write_products", category: "collections" },
  
  // Inventory
  { name: "get_inventory", description: "Fetch inventory levels for products", scope: "read_inventory", category: "inventory" },
  { name: "update_inventory", description: "Update inventory levels", scope: "write_inventory", category: "inventory" },
  { name: "get_inventory_items", description: "Fetch inventory items", scope: "read_inventory", category: "inventory" },
  { name: "adjust_inventory", description: "Adjust inventory quantities", scope: "write_inventory", category: "inventory" },
  
  // Fulfillments
  { name: "get_fulfillments", description: "Fetch fulfillments for orders", scope: "read_fulfillments", category: "fulfillments" },
  { name: "create_fulfillment", description: "Create a fulfillment for an order", scope: "write_fulfillments", category: "fulfillments" },
  { name: "update_fulfillment", description: "Update an existing fulfillment", scope: "write_fulfillments", category: "fulfillments" },
  { name: "cancel_fulfillment", description: "Cancel a fulfillment", scope: "write_fulfillments", category: "fulfillments" },
  
  // Draft Orders
  { name: "get_draft_orders", description: "Fetch draft orders from the store", scope: "read_draft_orders", category: "draft_orders" },
  { name: "get_draft_order", description: "Fetch a specific draft order by ID", scope: "read_draft_orders", category: "draft_orders" },
  { name: "create_draft_order", description: "Create a new draft order", scope: "write_draft_orders", category: "draft_orders" },
  { name: "update_draft_order", description: "Update an existing draft order", scope: "write_draft_orders", category: "draft_orders" },
  { name: "delete_draft_order", description: "Delete a draft order", scope: "write_draft_orders", category: "draft_orders" },
  { name: "complete_draft_order", description: "Complete a draft order and convert to order", scope: "write_draft_orders", category: "draft_orders" },
  
  // Discounts
  { name: "get_discounts", description: "Fetch discount codes from the store", scope: "read_discounts", category: "discounts" },
  { name: "get_discount", description: "Fetch a specific discount by ID", scope: "read_discounts", category: "discounts" },
  { name: "create_discount", description: "Create a new discount code", scope: "write_discounts", category: "discounts" },
  { name: "update_discount", description: "Update an existing discount", scope: "write_discounts", category: "discounts" },
  { name: "delete_discount", description: "Delete a discount code", scope: "write_discounts", category: "discounts" },
  
  // Gift Cards
  { name: "get_gift_cards", description: "Fetch gift cards from the store", scope: "read_gift_cards", category: "gift_cards" },
  { name: "get_gift_card", description: "Fetch a specific gift card by ID", scope: "read_gift_cards", category: "gift_cards" },
  { name: "create_gift_card", description: "Create a new gift card", scope: "write_gift_cards", category: "gift_cards" },
  { name: "update_gift_card", description: "Update an existing gift card", scope: "write_gift_cards", category: "gift_cards" },
  { name: "disable_gift_card", description: "Disable a gift card", scope: "write_gift_cards", category: "gift_cards" },
  
  // Files
  { name: "get_files", description: "Fetch files from the store", scope: "read_files", category: "files" },
  { name: "upload_file", description: "Upload a file to the store", scope: "write_files", category: "files" },
  { name: "delete_file", description: "Delete a file from the store", scope: "write_files", category: "files" },
  
  // Metaobjects
  { name: "get_metaobject_definitions", description: "Fetch metaobject definitions", scope: "read_metaobject_definitions", category: "metaobjects" },
  { name: "get_metaobjects", description: "Fetch metaobjects", scope: "read_metaobjects", category: "metaobjects" },
  { name: "create_metaobject", description: "Create a new metaobject", scope: "write_metaobjects", category: "metaobjects" },
  { name: "update_metaobject", description: "Update an existing metaobject", scope: "write_metaobjects", category: "metaobjects" },
  { name: "delete_metaobject", description: "Delete a metaobject", scope: "write_metaobjects", category: "metaobjects" },
  
  // Channels
  { name: "get_channels", description: "Fetch sales channels", scope: "read_channels", category: "channels" },
  { name: "create_channel", description: "Create a sales channel", scope: "write_channels", category: "channels" },
  { name: "update_channel", description: "Update a sales channel", scope: "write_channels", category: "channels" },
  { name: "delete_channel", description: "Delete a sales channel", scope: "write_channels", category: "channels" },
  
  // Locations
  { name: "get_locations", description: "Fetch store locations", scope: "read_locations", category: "locations" },
  { name: "create_location", description: "Create a new location", scope: "write_locations", category: "locations" },
  { name: "update_location", description: "Update an existing location", scope: "write_locations", category: "locations" },
  { name: "delete_location", description: "Delete a location", scope: "write_locations", category: "locations" },
  
  // Marketing
  { name: "get_marketing_events", description: "Fetch marketing events", scope: "read_marketing_events", category: "marketing" },
  { name: "create_marketing_event", description: "Create a marketing event", scope: "write_marketing_events", category: "marketing" },
  
  // Analytics
  { name: "get_analytics", description: "Fetch store analytics data", scope: "read_analytics", category: "analytics" },
  { name: "shopifyql_query", description: "Execute a ShopifyQL query for analytics", scope: "read_analytics", category: "analytics" },
  
  // Shop Information
  { name: "get_shop_info", description: "Fetch general shop information", scope: "read_analytics", category: "shop" },
  { name: "get_shop_policies", description: "Fetch shop policies", scope: "read_legal_policies", category: "shop" },
];

export function getToolsByCategory(category: string): ToolDefinition[] {
  return toolDefinitions.filter(tool => tool.category === category);
}

export function getToolsByScope(scope: string): ToolDefinition[] {
  return toolDefinitions.filter(tool => tool.scope === scope);
}

export function getAllToolNames(): string[] {
  return toolDefinitions.map(tool => tool.name);
}
