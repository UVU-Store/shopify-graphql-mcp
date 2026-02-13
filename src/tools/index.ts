import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";
import { getEnabledCategories, getEnabledToolCount, getCategoryConfig } from "../config/tool-categories.js";

// Import all tool registration functions
import { registerOrderTools } from "./orders.js";
import { registerProductTools } from "./products.js";
import { registerCustomerTools } from "./customers.js";
import { registerCollectionTools } from "./collections.js";
import { registerInventoryTools } from "./inventory.js";
import { registerDraftOrderTools } from "./draft-orders.js";
import { registerDiscountTools } from "./discounts.js";
import { registerLocationTools } from "./locations.js";
import { registerShopTools } from "./shop.js";
import { registerMetaobjectTools } from "./metaobjects.js";
import { registerAnalyticsTools } from "./analytics.js";
import { registerFulfillmentTools } from "./fulfillments.js";
import { registerCompanyTools } from "./companies.js";
import { registerChannelTools } from "./channels.js";
import { registerCheckoutTools } from "./checkouts.js";
import { registerAuditEventTools } from "./audit-events.js";
import { registerCartTransformTools } from "./cart-transforms.js";
import { registerValidationTools } from "./validations.js";
import { registerCashTrackingTools } from "./cash-tracking.js";
import { registerAppTools } from "./apps.js";
import { registerCustomFulfillmentServiceTools } from "./custom-fulfillment-services.js";
import { registerCustomPixelTools } from "./custom-pixels.js";
import { registerCustomerDataErasureTools } from "./customer-data-erasure.js";
import { registerCustomerPaymentMethodTools } from "./customer-payment-methods.js";
import { registerCustomerMergeTools } from "./customer-merge.js";
import { registerDeliveryCustomizationTools } from "./delivery-customizations.js";
import { registerPriceRuleTools } from "./price-rules.js";
import { registerDiscoveryTools } from "./discovery.js";
import { registerFileTools } from "./files.js";
import { registerFulfillmentConstraintTools } from "./fulfillment-constraints.js";
import { registerGiftCardTools } from "./gift-cards.js";
import { registerInventoryShipmentTools } from "./inventory-shipments.js";
import { registerInventoryTransferTools } from "./inventory-transfers.js";
import { registerLegalPolicyTools } from "./legal-policies.js";
import { registerDeliveryOptionGeneratorTools } from "./delivery-option-generators.js";
import { registerLocaleTools } from "./locales.js";
import { registerMarketingCampaignTools } from "./marketing-campaigns.js";
import { registerMarketTools } from "./markets.js";
import { registerNavigationTools } from "./navigation.js";
import { registerPageTools } from "./pages.js";
import { registerOrderEditTools } from "./order-edits.js";
import { registerPackingSlipTemplateTools } from "./packing-slip-templates.js";
import { registerPaymentTermsTools } from "./payment-terms.js";
import { registerPaymentCustomizationTools } from "./payment-customizations.js";
import { registerShopifyPaymentsTools } from "./shopify-payments.js";
import { registerReturnsTools } from "./returns.js";
import { registerStoreCreditTools } from "./store-credit.js";
import { registerSubscriptionTools } from "./subscriptions.js";
import { registerScriptTagTools } from "./script-tags.js";
import { registerThemeTools } from "./themes.js";
import { registerTranslationTools } from "./translations.js";
import { registerPublicationTools } from "./publications.js";
import { registerPixelTools } from "./pixels.js";
import { registerPrivacySettingsTools } from "./privacy-settings.js";
import { registerShippingTools } from "./shipping.js";
import { registerReportTools } from "./reports.js";
import { registerResourceFeedbackTools } from "./resource-feedbacks.js";
import { registerProductListingTools } from "./product-listings.js";

// Map of module names to their registration functions
const TOOL_REGISTRARS: Record<string, (server: McpServer, client: ShopifyGraphQLClient) => void> = {
  'shop': registerShopTools,
  'products': registerProductTools,
  'orders': registerOrderTools,
  'customers': registerCustomerTools,
  'collections': registerCollectionTools,
  'inventory': registerInventoryTools,
  'locations': registerLocationTools,
  'draft-orders': registerDraftOrderTools,
  'discounts': registerDiscountTools,
  'fulfillments': registerFulfillmentTools,
  'gift-cards': registerGiftCardTools,
  'returns': registerReturnsTools,
  'checkouts': registerCheckoutTools,
  'payment-terms': registerPaymentTermsTools,
  'payment-customizations': registerPaymentCustomizationTools,
  'shopify-payments': registerShopifyPaymentsTools,
  'order-edits': registerOrderEditTools,
  'store-credit': registerStoreCreditTools,
  'subscriptions': registerSubscriptionTools,
  'companies': registerCompanyTools,
  'cash-tracking': registerCashTrackingTools,
  'fulfillment-constraints': registerFulfillmentConstraintTools,
  'delivery-customizations': registerDeliveryCustomizationTools,
  'delivery-option-generators': registerDeliveryOptionGeneratorTools,
  'custom-fulfillment-services': registerCustomFulfillmentServiceTools,
  'marketing-campaigns': registerMarketingCampaignTools,
  'markets': registerMarketTools,
  'channels': registerChannelTools,
  'discovery': registerDiscoveryTools,
  'price-rules': registerPriceRuleTools,
  'analytics': registerAnalyticsTools,
  'pixels': registerPixelTools,
  'publications': registerPublicationTools,
  'pages': registerPageTools,
  'navigation': registerNavigationTools,
  'themes': registerThemeTools,
  'files': registerFileTools,
  'metaobjects': registerMetaobjectTools,
  'translations': registerTranslationTools,
  'locales': registerLocaleTools,
  'legal-policies': registerLegalPolicyTools,
  'cart-transforms': registerCartTransformTools,
  'validations': registerValidationTools,
  'audit-events': registerAuditEventTools,
  'custom-pixels': registerCustomPixelTools,
  'script-tags': registerScriptTagTools,
  'customer-data-erasure': registerCustomerDataErasureTools,
  'customer-merge': registerCustomerMergeTools,
  'customer-payment-methods': registerCustomerPaymentMethodTools,
  'privacy-settings': registerPrivacySettingsTools,
  'shipping': registerShippingTools,
  'product-listings': registerProductListingTools,
  'reports': registerReportTools,
  'resource-feedbacks': registerResourceFeedbackTools,
  'apps': registerAppTools,
  'inventory-shipments': registerInventoryShipmentTools,
  'inventory-transfers': registerInventoryTransferTools,
  'packing-slip-templates': registerPackingSlipTemplateTools,
};

export function registerTools(server: McpServer): void {
  // Get enabled categories from environment
  const enabledCategories = getEnabledCategories();
  const enabledModules = new Set<string>();
  
  // Build set of enabled modules
  for (const category of enabledCategories) {
    const config = getCategoryConfig(category);
    if (config) {
      config.modules.forEach(module => enabledModules.add(module));
    }
  }

  // Log configuration
  console.error(`[INFO] Enabled tool categories: ${enabledCategories.length > 0 ? enabledCategories.join(', ') : 'none'}`);
  console.error(`[INFO] Estimated tool count: ${getEnabledToolCount(enabledCategories)}`);
  
  if (enabledCategories.length > 0) {
    const envValue = process.env.ENABLED_TOOL_CATEGORIES;
    if (!envValue) {
      console.error(`[INFO] Set ENABLED_TOOL_CATEGORIES=essential for ~35 tools, or =all for all tools`);
    }
  }

  // Always register health check
  server.registerTool(
    "health_check",
    {
      description: "Check if the Shopify GraphQL MCP server is running and configured",
    },
    async () => {
      const token = process.env.SHOPIFY_ACCESS_TOKEN;
      const storeUrl = process.env.SHOPIFY_STORE_URL;
      const apiUrl = process.env.SHOPIFY_STORE_API_URL;
      
      const configured = !!(token && storeUrl && apiUrl);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: configured ? "healthy" : "not_configured",
                message: configured
                  ? "Server is running and configured"
                  : "Server is running but missing required environment variables: SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE_URL, SHOPIFY_STORE_API_URL",
                enabledCategories,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Skip tool registration if no categories enabled
  if (enabledCategories.length === 0) {
    console.error("[WARN] No tool categories enabled. Only health_check available.");
    return;
  }

  let client: ShopifyGraphQLClient;

  try {
    client = new ShopifyGraphQLClient();
  } catch (error) {
    console.error("Failed to initialize ShopifyGraphQLClient:", error instanceof Error ? error.message : String(error));
    console.error("Make sure environment variables are set: SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE_URL, SHOPIFY_STORE_API_URL");
    return;
  }

  // Register enabled tools
  let registeredCount = 0;
  
  for (const moduleName of enabledModules) {
    const registrar = TOOL_REGISTRARS[moduleName];
    if (registrar) {
      try {
        registrar(server, client);
        registeredCount++;
      } catch (error) {
        console.error(`[ERROR] Failed to register tools for module '${moduleName}':`, error instanceof Error ? error.message : String(error));
      }
    } else {
      console.error(`[WARN] No registrar found for module: ${moduleName}`);
    }
  }

  console.error(`[INFO] Successfully registered ${registeredCount} tool modules`);
}
