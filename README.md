# Shopify GraphQL MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to the Shopify Admin GraphQL API via cURL. This server exposes all major Shopify resources as MCP tools, allowing AI assistants like Claude to interact with your Shopify store programmatically.

> **🚧 Project Status**: This project is currently in active development. New tools and features are being added regularly.

> **Created by**: Students at Utah Valley University in Orem, UT

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Shopify store with Admin API access
- Shopify Admin API access token

## Installation

### 1. Clone or Create Project

```bash
git clone <repository-url>
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

### Tool Categories (Recommended for IDE Compatibility)

This MCP server provides **150+ tools** covering all Shopify operations. Some IDEs have limits on tool counts, so you can enable/disable tool categories via the `ENABLED_TOOL_CATEGORIES` environment variable:

| Category | Description | ~Tool Count | Modules |
|----------|-------------|-------------|---------|
| `essential` | Core e-commerce: products, orders, customers, inventory | ~35 | shop, products, orders, customers, inventory, collections, locations, draft-orders, discounts, fulfillments |
| `commerce` | Extended commerce: gift cards, returns, checkouts, B2B | ~25 | gift-cards, returns, checkouts, payment-terms, order-edits, companies, cash-tracking, fulfillment-constraints, delivery-customizations, delivery-option-generators, custom-fulfillment-services |
| `marketing` | Marketing: campaigns, markets, analytics, channels | ~20 | marketing-campaigns, markets, channels, discovery, price-rules, analytics, pixels, publications |
| `content` | Content: pages, themes, files, metaobjects | ~25 | pages, navigation, themes, files, metaobjects, translations, locales, legal-policies |
| `advanced` | Advanced: cart transforms, validations, scripts | ~20 | cart-transforms, validations, audit-events, custom-pixels, script-tags, customer-data-erasure, customer-merge, customer-payment-methods, privacy-settings, shipping, product-listings |
| `reporting` | Reports and feedback | ~15 | reports, resource-feedbacks, apps |
| `automation` | Inventory automation | ~15 | inventory-shipments, inventory-transfers, packing-slip-templates |

**Recommended configurations:**

```json
// Minimal - Essential only (~35 tools) - Best for most users
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential"
  }
}

// Standard - Essential + Commerce (~60 tools)
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,commerce"
  }
}

// Marketing Focus - Essential + Marketing (~55 tools)
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,marketing"
  }
}

// Full Power User (~105 tools)
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,commerce,marketing,content"
  }
}

// Everything (~155 tools) - May overwhelm some IDEs
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "all"
  }
}
```

**Default behavior:** If `ENABLED_TOOL_CATEGORIES` is not set, **all categories are enabled** (backward compatible).

**IDE Compatibility:**
- **Cursor**: ~100-150 tools recommended
- **Claude Desktop**: ~200+ tools supported
- **Zed**: ~50-75 tools recommended

See [TOOL_CATEGORIES.md](./TOOL_CATEGORIES.md) for complete documentation.

### Getting Your Access Token

1. Log in to your Shopify Admin
2. Go to **Settings** > **Apps and sales channels** > **Develop apps**
3. Create a new app or use an existing one
4. Click **Configure Admin API scopes**
5. Select the required scopes (see Required Scopes section below)
6. Install the app to your store
7. Copy the **Admin API access token**

### MCP Client Configuration

Add this server to your MCP client configuration (e.g., Claude Desktop, Cursor):

**macOS/Linux (Recommended - Essential Tools Only):**
```json
{
  "mcpServers": {
    "shopify-graphql": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/shopify-graphql-mcp/dist/index.js"],
      "env": {
        "SHOPIFY_ACCESS_TOKEN": "shpat_xxxxx",
        "SHOPIFY_STORE_URL": "your-store.myshopify.com",
        "SHOPIFY_STORE_API_URL": "https://your-store.myshopify.com/admin/api/2025-01/graphql.json",
        "ENABLED_TOOL_CATEGORIES": "essential"
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
        "SHOPIFY_STORE_API_URL": "https://your-store.myshopify.com/admin/api/2025-01/graphql.json",
        "ENABLED_TOOL_CATEGORIES": "essential"
      }
    }
  }
}
```

## Available Tools

This MCP server provides **150+ tools** organized into 7 categories. For a complete list of all available tools, see the **[TOOL_CATEGORIES.md](./TOOL_CATEGORIES.md)** file.

### Tool Categories

| Category | Description | ~Tool Count |
|----------|-------------|-------------|
| **Essential** | Core e-commerce: products, orders, customers, inventory | ~35 |
| **Commerce** | Extended commerce: gift cards, returns, checkouts, B2B | ~25 |
| **Marketing** | Marketing: campaigns, markets, analytics, channels | ~20 |
| **Content** | Content: pages, themes, files, metaobjects | ~25 |
| **Advanced** | Advanced: cart transforms, validations, scripts | ~20 |
| **Reporting** | Reports and feedback | ~15 |
| **Automation** | Inventory automation | ~15 |

See [TOOL_CATEGORIES.md](./TOOL_CATEGORIES.md) for the complete tool reference.

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

### Marketing Campaign
```
"Create a marketing event for our summer sale starting next week"
```

### Content Management
```
"Create a new page called 'About Us' with our company story"
```

## Development

### Project Structure
```
shopify-graphql-mcp/
├── src/
│   ├── index.ts              # Server entry point
│   ├── tools/                # Tool implementations organized by category
│   │   ├── index.ts         # Tool registration and category management
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   └── ... (50+ tool modules)
│   ├── config/
│   │   └── tool-categories.ts  # Category configuration
│   ├── utils/
│   │   ├── graphql-client.ts
│   │   └── scope-mapper.ts
│   └── types/
│       └── index.ts
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
├── TOOL_CATEGORIES.md       # Detailed category documentation
└── README.md
```

### Adding New Tools

1. Define the tool in the appropriate category file in `src/tools/`
2. Use the `server.registerTool()` pattern
3. Include Zod schema validation for inputs
4. Handle errors gracefully
5. Add the tool to the category configuration in `src/config/tool-categories.ts`

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

### Tool Categories Not Working
Check the `health_check` tool output to see which categories are enabled:
```
"Run health check to see my server status"
```

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

Based on the tools you enable, the following scopes may be required:

### Essential Category
- `read_orders`, `write_orders`
- `read_products`, `write_products`
- `read_customers`, `write_customers`
- `read_inventory`, `write_inventory`
- `read_draft_orders`, `write_draft_orders`
- `read_discounts`, `write_discounts`
- `read_locations`, `write_locations`
- `read_fulfillments`, `write_fulfillments`

### Commerce Category
- `read_gift_cards`, `write_gift_cards`
- `read_returns`, `write_returns`
- `read_checkouts`, `write_checkouts`
- `read_payment_terms`, `write_payment_terms`
- `read_order_edits`, `write_order_edits`
- `read_companies`, `write_companies`
- `read_cash_tracking`, `write_cash_tracking`

### Marketing Category
- `read_marketing_events`, `write_marketing_events`
- `read_markets`, `write_markets`
- `read_channels`, `write_channels`
- `read_price_rules`, `write_price_rules`
- `read_analytics`
- `read_pixels`, `write_pixels`
- `read_publications`, `write_publications`

### Content Category
- `read_metaobject_definitions`, `write_metaobject_definitions`
- `read_metaobjects`, `write_metaobjects`
- `read_themes`, `write_themes`
- `read_files`, `write_files`
- `read_pages`, `write_pages`
- `read_translations`, `write_translations`

### Advanced Category
- `read_cart_transforms`, `write_cart_transforms`
- `read_validations`, `write_validations`
- `read_audit_events`
- `read_customer_events`
- `read_privacy_settings`, `write_privacy_settings`

### Reporting Category
- `read_reports`, `write_reports`
- `read_apps`, `write_apps`

### Automation Category
- `read_inventory_shipments`, `write_inventory_shipments`
- `read_inventory_transfers`, `write_inventory_transfers`

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- TypeScript strict mode compliance
- Zod schema validation for all tool inputs
- Error handling for all GraphQL operations
- Updated documentation for new tools
- Proper categorization in `TOOL_CATEGORIES.md`

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your Shopify API credentials
3. Ensure your access token has the required scopes
4. Review the [Shopify Admin GraphQL API documentation](https://shopify.dev/docs/api/admin-graphql)
5. Check `TOOL_CATEGORIES.md` for tool category configuration help
