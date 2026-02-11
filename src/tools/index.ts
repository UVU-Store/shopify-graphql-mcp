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
}
