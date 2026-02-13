# Tool Category Configuration

The Shopify GraphQL MCP supports organizing tools into categories for easy management. You can enable or disable categories via the `ENABLED_TOOL_CATEGORIES` environment variable.

## Categories

| Category | Description | ~Tool Count | Modules | Status |
|----------|-------------|-------------|---------|--------|
| `essential` | Core e-commerce operations | 42 | shop, products, orders, customers, inventory, collections, locations, draft-orders, discounts, fulfillments | ✅ |
| `commerce` | Extended commerce features | 79 | gift-cards, returns, checkouts, payment-terms, payment-customizations, shopify-payments, order-edits, companies, cash-tracking, store-credit, subscriptions, fulfillment-constraints, delivery-customizations, delivery-option-generators, custom-fulfillment-services | ✅ |
| `marketing` | Marketing and promotional tools | 30 | marketing-campaigns, markets, channels, discovery, price-rules, analytics, pixels, publications | |
| `content` | Store content and theming | 35 | pages, navigation, themes, files, metaobjects, translations, locales, legal-policies | |
| `advanced` | Complex/technical features | 31 | cart-transforms, validations, audit-events, custom-pixels, script-tags, customer-data-erasure, customer-merge, customer-payment-methods, privacy-settings, shipping, product-listings | |
| `reporting` | Reports and feedback | 15 | reports, resource-feedbacks, apps | |
| `automation` | Inventory automation | 14 | inventory-shipments, inventory-transfers, packing-slip-templates | |

### Status Legend

- **✅** - Category implementation is complete (all documented tools are implemented)
- **⏳** - Category implementation is in progress (some tools pending)

---

## Available Tools

### 🏪 Essential Category (42 tools)

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

### 🛒 Commerce Category (79 tools)

Extended commerce features for advanced store operations, including payment processing, subscriptions, and store credit.

#### Gift Cards (6 tools)
- `get_gift_cards` - Fetch gift cards
- `get_gift_card` - Get a specific gift card
- `create_gift_card` - Create a gift card
- `update_gift_card` - Update a gift card
- `disable_gift_card` - Disable a gift card
- `get_gift_card_transactions` - Get gift card transactions

#### Returns (7 tools)
- `get_returnable_fulfillments` - Fetch fulfillments eligible for return
- `get_returns_by_order` - Fetch returns for a specific order
- `get_return` - Get a specific return by ID
- `create_return` - Create a return
- `approve_return_request` - Approve a return request
- `decline_return_request` - Decline a return request
- `close_return` - Close a return

#### Checkouts (5 tools)
- `get_checkouts` - Fetch checkouts
- `get_checkout` - Get a specific checkout
- `create_checkout` - Create a checkout
- `update_checkout` - Update a checkout
- `complete_checkout` - Complete a checkout

#### Payment Terms (5 tools)
- `get_payment_terms` - Fetch payment terms configurations
- `create_payment_terms` - Create new payment terms
- `update_payment_terms` - Update existing payment terms
- `delete_payment_terms` - Delete payment terms
- `get_payment_mandates` - Fetch payment mandates

#### Payment Customizations (6 tools)
- `get_payment_customizations` - Fetch payment customizations
- `get_payment_customization` - Get a specific payment customization
- `create_payment_customization` - Create a payment customization
- `update_payment_customization` - Update a payment customization
- `delete_payment_customization` - Delete a payment customization
- `set_payment_customization_activation` - Activate/deactivate payment customizations

#### Shopify Payments (6 tools)
- `get_shopify_payments_account` - Get Shopify Payments account info and balances
- `get_shopify_payments_balance_transactions` - Fetch balance transactions
- `get_shopify_payments_payouts` - Fetch payouts with detailed summaries
- `get_shopify_payments_disputes` - Get disputes with evidence details
- `get_shopify_payments_bank_accounts` - List configured bank accounts
- `create_shopify_payments_alternate_currency_payout` - Create alternate currency payout

#### Order Edits (5 tools)
- `get_order_edit` - Get a specific order edit by ID
- `calculate_order_edit` - Calculate order edit changes
- `apply_order_edit` - Apply an order edit to the order
- `add_line_items_to_order` - Add line items during order edit
- `remove_line_items_from_order` - Remove line items during order edit

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

#### Store Credit (4 tools)
- `get_store_credit_account` - Get store credit account with transaction history
- `get_store_credit_accounts_by_owner` - List accounts by customer/company
- `credit_store_credit_account` - Add funds to a store credit account
- `debit_store_credit_account` - Remove funds from a store credit account

#### Subscriptions (11 tools)
- `get_subscription_contracts` - List all subscription contracts
- `get_subscription_contract` - Get detailed contract information
- `create_subscription_contract` - Create a new subscription contract (draft)
- `create_subscription_contract_atomic` - Create complete contract in one operation
- `cancel_subscription_contract` - Cancel a subscription contract
- `pause_subscription_contract` - Pause a subscription contract
- `activate_subscription_contract` - Activate a paused/failed contract
- `set_subscription_contract_next_billing_date` - Update the next billing date
- `expire_subscription_contract` - Expire a subscription contract
- `fail_subscription_contract` - Mark contract as failed
- `update_subscription_contract_product` - Change product/price on contract line

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

### 📢 Marketing Category (30 tools)

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

### 📝 Content Category (35 tools)

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

### ⚙️ Advanced Category (31 tools)

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

### 📊 Reporting Category (15 tools)

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

### 🔄 Automation Category (14 tools)

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

**Total**: 246 comprehensive tools across 7 categories

---

## Configuration

### Using Boolean Flags (Recommended)

Each category can be enabled/disabled with individual boolean flags:

```json
{
  "env": {
    "ENABLE_ESSENTIAL": "true",
    "ENABLE_COMMERCE": "true",
    "ENABLE_MARKETING": "false",
    "ENABLE_CONTENT": "false",
    "ENABLE_ADVANCED": "false",
    "ENABLE_REPORTING": "false",
    "ENABLE_AUTOMATION": "false"
  }
}
```

#### Quick Presets

**Essential Only (42 tools)**
```json
{
  "env": {
    "ENABLE_ESSENTIAL": "true",
    "ENABLE_COMMERCE": "false",
    "ENABLE_MARKETING": "false",
    "ENABLE_CONTENT": "false",
    "ENABLE_ADVANCED": "false",
    "ENABLE_REPORTING": "false",
    "ENABLE_AUTOMATION": "false"
  }
}
```

**Essential + Commerce (121 tools)**
```json
{
  "env": {
    "ENABLE_ESSENTIAL": "true",
    "ENABLE_COMMERCE": "true",
    "ENABLE_MARKETING": "false",
    "ENABLE_CONTENT": "false",
    "ENABLE_ADVANCED": "false",
    "ENABLE_REPORTING": "false",
    "ENABLE_AUTOMATION": "false"
  }
}
```

### Legacy Format (Still Supported)

You can also use the comma-separated format:

```json
{
  "env": {
    "ENABLED_TOOL_CATEGORIES": "essential,commerce"
  }
}
```

Valid values:
- `"all"` - Enable all categories (default if nothing is set)
- `"none"` - Disable all categories
- `"essential"` - Only essential
- `"essential,commerce,marketing"` - Multiple categories

### Default Behavior

If no boolean flags or `ENABLED_TOOL_CATEGORIES` is set, **all categories are enabled** (backward compatible).

To see which categories are available and their status, use the `health_check` tool - it returns the list of enabled categories in its response.

## IDE Compatibility

Different IDEs have different limits on MCP tool counts:

- **Cursor**: ~100-150 tools recommended
- **Claude Desktop**: ~200+ tools supported
- **Zed**: ~50-75 tools recommended
- **Other editors**: Check your editor's documentation

Start with `essential` (42 tools) and add categories as needed.
