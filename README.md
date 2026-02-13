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

### 🏪 Essential Category (~35 tools)

Core e-commerce operations for day-to-day store management.

#### Shop Management (3 tools)
- `health_check` - Check server status and configuration
- `get_shop_info` - Get general shop information
- `get_shop_policies` - Get shop policies

#### Products (5 tools)
- `get_products` - Fetch products with filtering
- `get_product` - Get a specific product by ID
- `create_product` - Create a new product
- `update_product` - Update an existing product
- `delete_product` - Delete a product

#### Orders (3 tools)
- `get_orders` - Fetch orders with filtering and pagination
- `get_order` - Get a specific order by ID
- `get_all_orders` - Fetch all orders with comprehensive data (includes archived/cancelled)

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
- `get_discount_code` - Get a specific discount code
- `create_discount_code` - Create a discount code
- `update_discount_code` - Update a discount code
- `delete_discount_code` - Delete a discount code

#### Locations (2 tools)
- `get_locations` - Fetch store locations
- `get_location` - Get a specific location

#### Fulfillments (6 tools)
- `get_fulfillments` - Fetch fulfillments
- `get_fulfillment` - Get a specific fulfillment
- `create_fulfillment` - Create a fulfillment
- `update_tracking` - Update tracking information
- `cancel_fulfillment` - Cancel a fulfillment
- `get_fulfillment_orders` - Fetch fulfillment orders

---

### 🛒 Commerce Category (~25 tools)

Extended commerce features for advanced store operations.

#### Gift Cards (6 tools)
- `get_gift_cards` - Fetch gift cards
- `get_gift_card` - Get a specific gift card
- `create_gift_card` - Create a gift card
- `update_gift_card` - Update a gift card
- `disable_gift_card` - Disable a gift card
- `get_gift_card_transactions` - Get gift card transactions

#### Returns (3 tools)
- `get_returns` - Fetch returns
- `get_return` - Get a specific return
- `create_return` - Create a return

#### Checkouts (5 tools)
- `get_checkouts` - Fetch checkouts
- `get_checkout` - Get a specific checkout
- `create_checkout` - Create a checkout
- `update_checkout` - Update a checkout
- `complete_checkout` - Complete a checkout

#### Payment Terms (3 tools)
- `get_payment_terms` - Fetch payment terms
- `get_payment_term` - Get a specific payment term
- `create_payment_term` - Create a payment term

#### Order Edits (3 tools)
- `get_order_edits` - Fetch order edits
- `get_order_edit` - Get a specific order edit
- `begin_order_edit` - Begin an order edit

#### Companies - B2B (5 tools)
- `get_companies` - Fetch companies
- `get_company` - Get a specific company
- `create_company` - Create a company
- `update_company` - Update a company
- `delete_company` - Delete a company

#### Cash Tracking (4 tools)
- `get_cash_tracking_sessions` - Fetch cash tracking sessions for POS
- `get_cash_tracking_session` - Get a specific cash tracking session
- `create_cash_tracking_session` - Create a cash tracking session
- `update_cash_tracking_session` - Update a cash tracking session

#### Fulfillment Constraints (4 tools)
- `get_fulfillment_constraints` - Fetch fulfillment constraints
- `create_fulfillment_constraint` - Create a fulfillment constraint
- `update_fulfillment_constraint` - Update a fulfillment constraint
- `delete_fulfillment_constraint` - Delete a fulfillment constraint

#### Delivery Customizations (4 tools)
- `get_delivery_customizations` - Fetch delivery customizations
- `create_delivery_customization` - Create a delivery customization
- `update_delivery_customization` - Update a delivery customization
- `delete_delivery_customization` - Delete a delivery customization

#### Delivery Option Generators (3 tools)
- `get_delivery_option_generators` - Fetch delivery option generators
- `get_delivery_option_generator` - Get a specific delivery option generator
- `create_delivery_option_generator` - Create a delivery option generator

#### Custom Fulfillment Services (4 tools)
- `get_custom_fulfillment_services` - Fetch custom fulfillment services
- `get_custom_fulfillment_service` - Get a specific custom fulfillment service
- `create_custom_fulfillment_service` - Create a custom fulfillment service
- `update_custom_fulfillment_service` - Update a custom fulfillment service

---

### 📢 Marketing Category (~20 tools)

Marketing, promotional, and sales channel tools.

#### Marketing Campaigns (6 tools)
- `get_marketing_events` - Fetch marketing events
- `get_marketing_event` - Get a specific marketing event
- `create_marketing_event` - Create a marketing event
- `update_marketing_event` - Update a marketing event
- `delete_marketing_event` - Delete a marketing event
- `get_marketing_integrated_campaigns` - Fetch integrated campaigns

#### Markets (3 tools)
- `get_markets` - Fetch markets
- `get_market` - Get a specific market
- `create_market` - Create a market

#### Channels (5 tools)
- `get_channels` - Fetch sales channels
- `get_channel` - Get a specific channel
- `create_channel` - Create a channel
- `update_channel` - Update a channel
- `delete_channel` - Delete a channel

#### Discovery (3 tools)
- `discover_resources` - Discover available resources
- `search_resources` - Search across resources
- `get_resource_schema` - Get schema for a resource type

#### Price Rules (5 tools)
- `get_price_rules` - Fetch price rules
- `get_price_rule` - Get a specific price rule
- `create_price_rule` - Create a price rule
- `update_price_rule` - Update a price rule
- `delete_price_rule` - Delete a price rule

#### Analytics (2 tools)
- `get_analytics_report` - Fetch analytics reports and metrics
- `run_shopifyql_query` - Execute ShopifyQL queries for custom analytics

#### Pixels (3 tools)
- `get_pixels` - Fetch pixels
- `get_pixel` - Get a specific pixel
- `create_pixel` - Create a pixel

#### Publications (3 tools)
- `get_publications` - Fetch publications
- `get_publication` - Get a specific publication
- `create_publication` - Create a publication

---

### 📝 Content Category (~25 tools)

Store content, theming, and media management.

#### Pages (5 tools)
- `get_pages` - Fetch online store pages
- `get_page` - Get a specific page
- `create_page` - Create a page
- `update_page` - Update a page
- `delete_page` - Delete a page

#### Navigation (4 tools)
- `get_navigation_menus` - Fetch navigation menus
- `get_navigation_menu` - Get a specific navigation menu
- `create_navigation_menu` - Create a navigation menu
- `update_navigation_menu` - Update a navigation menu

#### Themes (5 tools)
- `get_themes` - Fetch themes
- `get_theme` - Get a specific theme
- `create_theme` - Create a theme
- `update_theme` - Update a theme
- `delete_theme` - Delete a theme

#### Files (6 tools)
- `get_files` - Fetch files
- `get_file` - Get a specific file
- `create_file` - Upload a file
- `update_file` - Update a file
- `delete_file` - Delete a file
- `get_file_upload_url` - Get upload URL for large files

#### Metaobjects (6 tools)
- `get_metaobject_definitions` - Fetch metaobject definitions
- `get_metaobject_definition` - Get a specific metaobject definition
- `get_metaobjects` - Fetch metaobjects by type
- `create_metaobject` - Create a metaobject
- `update_metaobject` - Update a metaobject
- `delete_metaobject` - Delete a metaobject

#### Translations (3 tools)
- `get_translations` - Fetch translations
- `create_translation` - Create a translation
- `update_translation` - Update a translation

#### Locales (3 tools)
- `get_locales` - Fetch locales
- `get_locale` - Get a specific locale
- `create_locale` - Create a locale

#### Legal Policies (3 tools)
- `get_legal_policies` - Fetch legal policies
- `get_legal_policy` - Get a specific legal policy
- `update_legal_policy` - Update a legal policy

---

### ⚙️ Advanced Category (~20 tools)

Complex and technical features for power users.

#### Cart Transforms (5 tools)
- `get_cart_transforms` - Fetch cart transforms
- `get_cart_transform` - Get a specific cart transform
- `create_cart_transform` - Create a cart transform
- `update_cart_transform` - Update a cart transform
- `delete_cart_transform` - Delete a cart transform

#### Validations (4 tools)
- `get_cart_validations` - Fetch cart validations
- `get_cart_validation` - Get a specific cart validation
- `create_cart_validation` - Create a cart validation
- `delete_cart_validation` - Delete a cart validation

#### Audit Events (2 tools)
- `get_audit_events` - Fetch audit events (staff actions, app installations)
- `get_customer_events` - Fetch customer events (page views, product views)

#### Custom Pixels (5 tools)
- `get_custom_pixels` - Fetch custom pixels
- `get_custom_pixel` - Get a specific custom pixel
- `create_custom_pixel` - Create a custom pixel
- `update_custom_pixel` - Update a custom pixel
- `delete_custom_pixel` - Delete a custom pixel

#### Script Tags (3 tools)
- `get_script_tags` - Fetch script tags
- `create_script_tag` - Create a script tag
- `delete_script_tag` - Delete a script tag

#### Customer Data Management (3 tools)
- `merge_customers` - Merge two customer records
- `request_customer_data_erasure` - Request customer data deletion (GDPR)
- `get_customer_payment_methods` - Get customer payment methods

#### Privacy Settings (3 tools)
- `get_privacy_settings` - Fetch privacy settings
- `update_privacy_settings` - Update privacy settings
- `get_data_sale_opt_out` - Get data sale opt-out settings

#### Shipping (3 tools)
- `get_shipping_zones` - Fetch shipping zones
- `get_shipping_zone` - Get a specific shipping zone
- `create_shipping_zone` - Create a shipping zone

#### Product Listings (3 tools)
- `get_product_listings` - Fetch product listings
- `get_product_listing` - Get a specific product listing
- `update_product_listing` - Update a product listing

---

### 📊 Reporting Category (~15 tools)

Reports, feedback, and app management.

#### Reports (5 tools)
- `get_reports` - Fetch reports
- `get_report` - Get a specific report
- `create_report` - Create a report
- `update_report` - Update a report
- `delete_report` - Delete a report

#### Resource Feedbacks (5 tools)
- `get_resource_feedbacks` - Fetch resource feedbacks
- `create_resource_feedback` - Create resource feedback
- `update_resource_feedback` - Update resource feedback
- `delete_resource_feedback` - Delete resource feedback

#### Apps (5 tools)
- `get_apps` - Fetch installed apps
- `get_app` - Get a specific app
- `get_app_proxy` - Get app proxy configuration
- `create_app_proxy` - Create an app proxy
- `delete_app_proxy` - Delete an app proxy

---

### 🔄 Automation Category (~15 tools)

Inventory automation and advanced fulfillment workflows.

#### Inventory Shipments (5 tools)
- `get_inventory_shipments` - Fetch inventory shipments
- `get_inventory_shipment` - Get a specific inventory shipment
- `create_inventory_shipment` - Create an inventory shipment
- `update_inventory_shipment` - Update an inventory shipment
- `delete_inventory_shipment` - Delete an inventory shipment

#### Inventory Transfers (5 tools)
- `get_inventory_transfers` - Fetch inventory transfers
- `get_inventory_transfer` - Get a specific inventory transfer
- `create_inventory_transfer` - Create an inventory transfer
- `update_inventory_transfer` - Update an inventory transfer
- `delete_inventory_transfer` - Delete an inventory transfer

#### Packing Slip Templates (4 tools)
- `get_packing_slip_templates` - Fetch packing slip templates
- `get_packing_slip_template` - Get a specific packing slip template
- `create_packing_slip_template` - Create a packing slip template
- `update_packing_slip_template` - Update a packing slip template

---

**Total**: 150+ comprehensive tools across 7 categories

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
