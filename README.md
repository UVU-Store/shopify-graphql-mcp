# Shopify GraphQL MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to the Shopify Admin GraphQL API via cURL. This server exposes all major Shopify resources as MCP tools, allowing AI assistants like Claude to interact with your Shopify store programmatically.

> **🚧 Project Status**: This project is currently in active development. New tools and features are being added regularly.



## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Shopify store with Admin API access
- Shopify Admin API access token

## Installation

### 1. Clone or Create Project

```bash
mkdir shopify-graphql-mcp
cd shopify-graphql-mcp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Server

```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_STORE_API_URL=https://your-store.myshopify.com/admin/api/2025-01/graphql.json
```

### Getting Your Access Token

1. Log in to your Shopify Admin
2. Go to **Settings** > **Apps and sales channels** > **Develop apps**
3. Create a new app or use an existing one
4. Click **Configure Admin API scopes**
5. Select the required scopes based on TOOLS.md
6. Install the app to your store
7. Copy the **Admin API access token**

### MCP Client Configuration

Add this server to your MCP client configuration (e.g., Claude Desktop, Cursor):

**macOS/Linux:**
```json
{
  "mcpServers": {
    "shopify-graphql": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/shopify-graphql-mcp/dist/index.js"],
      "env": {
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxx",
        "SHOPIFY_STORE_URL": "your-store.myshopify.com",
        "SHOPIFY_STORE_API_URL": "https://your-store.myshopify.com/admin/api/2025-01/graphql.json"
      }
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "shopify-graphql": {
      "command": "node",
      "args": ["C:\\PATH\\TO\\shopify-graphql-mcp\\dist\\index.js"],
      "env": {
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxx",
        "SHOPIFY_STORE_URL": "your-store.myshopify.com",
        "SHOPIFY_STORE_API_URL": "https://your-store.myshopify.com/admin/api/2025-01/graphql.json"
      }
    }
  }
}
```

## Available Tools

### 🏪 Core Store Operations

#### Orders (3 tools)
- `get_orders` - Fetch orders with filtering and pagination
- `get_order` - Get a specific order by ID
- `cancel_order` - Cancel an order

#### Products (5 tools)
- `get_products` - Fetch products with filtering
- `get_product` - Get a specific product by ID
- `create_product` - Create a new product
- `update_product` - Update an existing product
- `delete_product` - Delete a product

#### Customers (5 tools)
- `get_customers` - Fetch customers with filtering
- `get_customer` - Get a specific customer by ID
- `create_customer` - Create a new customer
- `update_customer` - Update an existing customer
- `delete_customer` - Delete a customer

#### Collections (5 tools)
- `get_collections` - Fetch collections
- `get_collection` - Get a specific collection
- `create_collection` - Create a manual or smart collection
- `update_collection` - Update a collection
- `delete_collection` - Delete a collection

#### Inventory (3 tools)
- `get_inventory_levels` - Fetch inventory levels
- `adjust_inventory` - Adjust inventory quantities
- `set_inventory_quantity` - Set on-hand inventory quantity

#### Draft Orders (5 tools)
- `get_draft_orders` - Fetch draft orders
- `get_draft_order` - Get a specific draft order
- `create_draft_order` - Create a draft order
- `complete_draft_order` - Convert draft order to order
- `delete_draft_order` - Delete a draft order

#### Discounts (5 tools)
- `get_discount_codes` - Fetch discount codes
- `create_discount_code` - Create a discount code
- `update_discount_code` - Update a discount code
- `delete_discount_code` - Delete a discount code
- `get_discount_code` - Get a specific discount code

#### Locations (2 tools)
- `get_locations` - Fetch store locations
- `get_location` - Get a specific location

#### Metaobjects (5 tools)
- `get_metaobject_definitions` - Fetch metaobject definitions
- `get_metaobject_definition` - Get a specific metaobject definition
- `get_metaobjects` - Fetch metaobjects by type
- `create_metaobject` - Create a metaobject
- `update_metaobject` - Update a metaobject
- `delete_metaobject` - Delete a metaobject

### 📊 Analytics & Reporting (2 tools)
- `get_analytics_report` - Fetch analytics reports and metrics
- `run_shopifyql_query` - Execute ShopifyQL queries for custom analytics

### 🏢 Shop Management (3 tools)
- `get_shop_info` - Get general shop information
- `get_shop_policies` - Get shop policies
- `health_check` - Check server status and configuration

### 🚚 Fulfillment & Shipping (6 tools)
- `get_fulfillments` - Fetch fulfillments
- `get_fulfillment` - Get a specific fulfillment
- `create_fulfillment` - Create a fulfillment
- `update_tracking` - Update tracking information
- `cancel_fulfillment` - Cancel a fulfillment
- `get_fulfillment_orders` - Fetch fulfillment orders

### 🏬 B2B Commerce (5 tools)
- `get_companies` - Fetch companies
- `get_company` - Get a specific company
- `create_company` - Create a company
- `update_company` - Update a company
- `delete_company` - Delete a company

### 💳 Payment & Checkout (6 tools)
- `get_checkouts` - Fetch checkouts
- `get_checkout` - Get a specific checkout
- `create_checkout` - Create a checkout
- `update_checkout` - Update a checkout
- `complete_checkout` - Complete a checkout
- `get_payment_methods` - Get available payment methods

### 🎯 Shopify Functions (20+ tools)

#### Cart Functions (5 tools)
- `get_cart_transforms` - Fetch cart transforms
- `create_cart_transform` - Create a cart transform
- `update_cart_transform` - Update a cart transform
- `delete_cart_transform` - Delete a cart transform
- `get_all_cart_transforms` - Fetch all cart transforms

#### Delivery Functions (4 tools)
- `get_delivery_customizations` - Fetch delivery customizations
- `create_delivery_customization` - Create a delivery customization
- `update_delivery_customization` - Update a delivery customization
- `delete_delivery_customization` - Delete a delivery customization

#### Discount Functions (4 tools)
- `get_discount_functions` - Fetch discount functions
- `create_discount_function` - Create a discount function
- `update_discount_function` - Update a discount function
- `delete_discount_function` - Delete a discount function

#### Fulfillment Functions (4 tools)
- `get_fulfillment_constraints` - Fetch fulfillment constraints
- `create_fulfillment_constraint` - Create a fulfillment constraint
- `update_fulfillment_constraint` - Update a fulfillment constraint
- `delete_fulfillment_constraint` - Delete a fulfillment constraint

#### Validation Functions (4 tools)
- `get_cart_validations` - Fetch cart validations
- `create_cart_validation` - Create a cart validation
- `update_cart_validation` - Update a cart validation
- `delete_cart_validation` - Delete a cart validation

### 🔧 Advanced Features (25+ tools)

#### Apps & Extensions (6 tools)
- `get_apps` - Fetch installed apps
- `get_app` - Get a specific app
- `get_app_proxy` - Get app proxy configuration
- `create_app_proxy` - Create an app proxy
- `update_app_proxy` - Update an app proxy
- `delete_app_proxy` - Delete an app proxy

#### Files & Media (6 tools)
- `get_files` - Fetch files
- `get_file` - Get a specific file
- `create_file` - Upload a file
- `update_file` - Update a file
- `delete_file` - Delete a file
- `get_file_upload_url` - Get upload URL for large files

#### Price Rules (5 tools)
- `get_price_rules` - Fetch price rules
- `get_price_rule` - Get a specific price rule
- `create_price_rule` - Create a price rule
- `update_price_rule` - Update a price rule
- `delete_price_rule` - Delete a price rule

#### Audit & Events (2 tools)
- `get_audit_events` - Fetch audit events (staff actions, app installations)
- `get_customer_events` - Fetch customer events (page views, product views)

#### Cash Tracking (4 tools)
- `get_cash_tracking_sessions` - Fetch cash tracking sessions for POS
- `get_cash_tracking_session` - Get a specific cash tracking session
- `create_cash_tracking_session` - Create a cash tracking session
- `update_cash_tracking_session` - Update a cash tracking session

#### Custom Pixels (6 tools)
- `get_custom_pixels` - Fetch custom pixels
- `get_custom_pixel` - Get a specific custom pixel
- `create_custom_pixel` - Create a custom pixel
- `update_custom_pixel` - Update a custom pixel
- `delete_custom_pixel` - Delete a custom pixel
- `get_custom_pixel_data` - Get custom pixel data

#### Customer Management (3 tools)
- `merge_customers` - Merge two customer records
- `request_customer_data_erasure` - Request customer data deletion (GDPR)
- `get_customer_payment_methods` - Get customer payment methods

#### Custom Fulfillment Services (4 tools)
- `get_custom_fulfillment_services` - Fetch custom fulfillment services
- `get_custom_fulfillment_service` - Get a specific custom fulfillment service
- `create_custom_fulfillment_service` - Create a custom fulfillment service
- `update_custom_fulfillment_service` - Update a custom fulfillment service

#### Discovery & Search (3 tools)
- `discover_resources` - Discover available resources
- `search_resources` - Search across resources
- `get_resource_schema` - Get schema for a resource type

#### Channels (5 tools)
- `get_channels` - Fetch sales channels
- `get_channel` - Get a specific channel
- `create_channel` - Create a channel
- `update_channel` - Update a channel
- `delete_channel` - Delete a channel

---

**Total Tools**: 100+ comprehensive tools covering all major Shopify operations

## Usage Examples

### Get Orders
```
"Get the last 10 orders from my store"
```

### Create Product
```
"Create a new product called 'Summer T-Shirt' with a $29.99 price"
```

### Update Inventory
```
"Set the inventory for variant ID gid://shopify/ProductVariant/123 to 100 at location ID gid://shopify/Location/456"
```

### Get Analytics
```
"Show me my store's total sales for last month using ShopifyQL"
```

## Development

### Project Structure
```
shopify-graphql-mcp/
├── src/
│   ├── index.ts              # Server entry point
│   ├── tools/                # Tool implementations
│   │   ├── index.ts         # Tool registration
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   └── ...
│   ├── utils/
│   │   ├── graphql-client.ts
│   │   └── scope-mapper.ts
│   └── types/
│       └── index.ts
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── mcp.json                 # Example MCP config
```

### Adding New Tools

1. Define the tool in the appropriate category file in `src/tools/`
2. Use the `server.registerTool()` pattern
3. Include Zod schema validation for inputs
4. Handle errors gracefully

Example:
```typescript
server.registerTool(
  "my_new_tool",
  {
    description: "Description of what this tool does",
    inputSchema: {
      param1: z.string().describe("Parameter description"),
    },
  },
  async ({ param1 }) => {
    // Implementation
  }
);
```

### Building

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

## Troubleshooting

### Environment Variables Not Found
Make sure all three environment variables are set:
- `SHOPIFY_ACCESS_TOKEN`
- `SHOPIFY_STORE_URL`
- `SHOPIFY_STORE_API_URL`

### GraphQL Errors
Check that your access token has the required scopes for the operations you're trying to perform.

### cURL Not Found
Ensure cURL is installed on your system:
```bash
# macOS
brew install curl

# Ubuntu/Debian
sudo apt-get install curl

# Windows
curl is included in Windows 10+
```

### Permission Denied (macOS/Linux)
Make sure the compiled file is executable:
```bash
chmod +x dist/index.js
```

## Security Notes

- Never commit your `SHOPIFY_ACCESS_TOKEN` to version control
- Use environment variables or a secure secrets manager
- The access token provides full API access to your store - keep it secure
- Consider using separate tokens for different environments (development, staging, production)

## Required Shopify Admin API Scopes

Based on the TOOLS.md file, the following scopes may be required depending on which tools you use:

- `read_orders`, `write_draft_orders`
- `read_products`, `write_products`
- `read_customers`, `write_customers`
- `read_inventory`, `write_inventory`
- `read_draft_orders`, `write_draft_orders`
- `read_discounts`, `write_discounts`
- `read_locations`, `write_locations`
- `read_metaobject_definitions`, `write_metaobject_definitions`
- `read_metaobjects`, `write_metaobjects`
- `read_analytics`

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- TypeScript strict mode compliance
- Zod schema validation for all tool inputs
- Error handling for all GraphQL operations
- Updated documentation for new tools

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your Shopify API credentials
3. Ensure your access token has the required scopes
4. Review the Shopify Admin GraphQL API documentation
