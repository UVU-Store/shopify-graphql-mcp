# Shopify GraphQL MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to the Shopify Admin GraphQL API via cURL. This server exposes all major Shopify resources as MCP tools, allowing AI assistants like Claude to interact with your Shopify store programmatically.

## Features

- **Complete API Coverage**: Tools for orders, products, customers, collections, inventory, draft orders, discounts, locations, metaobjects, and more
- **cURL Integration**: Uses cURL for GraphQL API requests
- **Environment-Based Configuration**: Securely manage credentials via environment variables
- **Type Safety**: Full TypeScript implementation with Zod schema validation
- **MCP Compliant**: Built with the official MCP SDK for seamless integration

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

### Orders
- `get_orders` - Fetch orders with filtering and pagination
- `get_order` - Get a specific order by ID
- `create_draft_order` - Create a new draft order

### Products
- `get_products` - Fetch products with filtering
- `get_product` - Get a specific product by ID
- `create_product` - Create a new product
- `update_product` - Update an existing product
- `delete_product` - Delete a product

### Customers
- `get_customers` - Fetch customers with filtering
- `get_customer` - Get a specific customer by ID
- `create_customer` - Create a new customer
- `update_customer` - Update an existing customer
- `delete_customer` - Delete a customer

### Collections
- `get_collections` - Fetch collections
- `get_collection` - Get a specific collection
- `create_collection` - Create a manual or smart collection
- `add_products_to_collection` - Add products to a collection
- `delete_collection` - Delete a collection

### Inventory
- `get_inventory` - Fetch inventory levels
- `adjust_inventory` - Adjust inventory quantities
- `set_inventory` - Set on-hand inventory quantity

### Draft Orders
- `get_draft_orders` - Fetch draft orders
- `get_draft_order` - Get a specific draft order
- `create_draft_order` - Create a draft order
- `complete_draft_order` - Convert draft order to order
- `delete_draft_order` - Delete a draft order

### Discounts
- `get_discounts` - Fetch discount codes
- `create_discount` - Create a discount code
- `delete_discount` - Delete a discount

### Locations
- `get_locations` - Fetch store locations
- `create_location` - Create a new location
- `update_location` - Update an existing location

### Metaobjects
- `get_metaobject_definitions` - Fetch metaobject definitions
- `get_metaobjects` - Fetch metaobjects by type
- `create_metaobject` - Create a metaobject
- `update_metaobject` - Update a metaobject
- `delete_metaobject` - Delete a metaobject

### Shop
- `get_shop_info` - Get general shop information
- `get_shop_policies` - Get shop policies
- `shopifyql_query` - Execute ShopifyQL analytics queries

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
