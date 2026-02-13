# Tool Category Configuration

The Shopify GraphQL MCP supports organizing tools into categories for easy management. You can enable or disable categories via the `ENABLED_TOOL_CATEGORIES` environment variable.

## Categories

| Category | Description | ~Tool Count | Modules |
|----------|-------------|-------------|---------|
| `essential` | Core e-commerce operations | ~35 | shop, products, orders, customers, inventory, collections, locations, draft-orders, discounts, fulfillments |
| `commerce` | Extended commerce features | ~25 | gift-cards, returns, checkouts, payment-terms, order-edits, companies, cash-tracking, fulfillment-constraints, delivery-customizations, delivery-option-generators, custom-fulfillment-services |
| `marketing` | Marketing and promotional tools | ~20 | marketing-campaigns, markets, channels, discovery, price-rules, analytics, pixels, publications |
| `content` | Store content and theming | ~25 | pages, navigation, themes, files, metaobjects, translations, locales, legal-policies |
| `advanced` | Complex/technical features | ~20 | cart-transforms, validations, audit-events, custom-pixels, script-tags, customer-data-erasure, customer-merge, customer-payment-methods, privacy-settings, shipping, product-listings |
| `reporting` | Reports and feedback | ~15 | reports, resource-feedbacks, apps |
| `automation` | Inventory automation | ~15 | inventory-shipments, inventory-transfers, packing-slip-templates |

## Configuration Examples

### Minimal (Essential Only) - Recommended for Most Users
```json
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential"
  }
}
```
~35 tools enabled

### Standard (Essential + Commerce)
```json
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,commerce"
  }
}
```
~60 tools enabled

### Marketing Focus
```json
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,marketing"
  }
}
```
~55 tools enabled

### Full Power User
```json
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,commerce,marketing,content"
  }
}
```
~105 tools enabled

### Everything Enabled
```json
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "all"
  }
}
```
All ~150+ tools enabled (may overwhelm some IDEs)

### Tools Only (No Content/Marketing)
```json
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,commerce,advanced,automation"
  }
}
```
~95 tools, focused on operations

## Environment Variable

Set via environment variable when running the server:

```bash
ENABLED_TOOL_CATEGORIES=essential,marketing node dist/index.js
```

Or in your MCP config:

```json
{
  "mcpServers": {
    "shopify-graphql": {
      "command": "node",
      "args": ["/path/to/shopify-graphql-mcp/dist/index.js"],
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

## Default Behavior

If `ENABLED_TOOL_CATEGORIES` is not set, **all categories are enabled** (backward compatible).

To see which categories are available and their status, use the `health_check` tool - it returns the list of enabled categories in its response.

## IDE Compatibility

Different IDEs have different limits on MCP tool counts:

- **Cursor**: ~100-150 tools recommended
- **Claude Desktop**: ~200+ tools supported
- **Zed**: ~50-75 tools recommended
- **Other editors**: Check your editor's documentation

Start with `essential` (~35 tools) and add categories as needed.
