import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";
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

export function registerTools(server: McpServer): void {
  // Always register a health check tool first
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

  let client: ShopifyGraphQLClient;

  try {
    client = new ShopifyGraphQLClient();
  } catch (error) {
    console.error("Failed to initialize ShopifyGraphQLClient:", error instanceof Error ? error.message : String(error));
    console.error("Make sure environment variables are set: SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE_URL, SHOPIFY_STORE_API_URL");
    return;
  }

  // Register all tool categories
  registerOrderTools(server, client);
  registerProductTools(server, client);
  registerCustomerTools(server, client);
  registerCollectionTools(server, client);
  registerInventoryTools(server, client);
  registerDraftOrderTools(server, client);
  registerDiscountTools(server, client);
  registerLocationTools(server, client);
  registerShopTools(server, client);
  registerMetaobjectTools(server, client);
  
  // Batch 1: First 25 scopes
  registerAnalyticsTools(server, client);
  registerFulfillmentTools(server, client);
  registerCompanyTools(server, client);
  registerChannelTools(server, client);
  registerCheckoutTools(server, client);
  registerAuditEventTools(server, client);
  registerCartTransformTools(server, client);
  registerValidationTools(server, client);
  registerCashTrackingTools(server, client);
  registerAppTools(server, client);
  
  // Batch 2: Next 25 scopes
  registerCustomFulfillmentServiceTools(server, client);
  registerCustomPixelTools(server, client);
  registerCustomerDataErasureTools(server, client);
  registerCustomerPaymentMethodTools(server, client);
  registerCustomerMergeTools(server, client);
  registerDeliveryCustomizationTools(server, client);
  registerPriceRuleTools(server, client);
  registerDiscoveryTools(server, client);
  registerFileTools(server, client);
  registerFulfillmentConstraintTools(server, client);
  
  // Batch 3: Additional scopes
  registerGiftCardTools(server, client);
  registerInventoryShipmentTools(server, client);
  registerInventoryTransferTools(server, client);
  registerLegalPolicyTools(server, client);
  registerDeliveryOptionGeneratorTools(server, client);
  registerLocaleTools(server, client);
  registerMarketingCampaignTools(server, client);
  
  // Batch 4: Markets, Navigation, Pages, Order Edits, Payment Terms
  registerMarketTools(server, client);
  registerNavigationTools(server, client);
  registerPageTools(server, client);
  registerOrderEditTools(server, client);
  registerPackingSlipTemplateTools(server, client);
  registerPaymentTermsTools(server, client);
}
