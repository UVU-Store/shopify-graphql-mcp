import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPrivacySettingsTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_privacy_settings",
    {
      description: "Fetch privacy settings from the Shopify store",
      inputSchema: {},
    },
    async () => {
      const graphqlQuery = `
        query GetPrivacySettings {
          privacy {
            checkout {
              gdprApplies
              legalPrivacyName
            }
            customerAccounts {
              gdprApplies
              legalPrivacyName
            }
            marketing {
              gdprApplies
              legalPrivacyName
            }
            preferences {
              gdprApplies
              legalPrivacyName
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, {});
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.registerTool(
    "update_privacy_settings",
    {
      description: "Update privacy settings",
      inputSchema: {
        gdprApplies: z.boolean().optional().describe("Whether GDPR applies"),
        legalPrivacyName: z.string().optional().describe("Legal privacy name"),
        checkoutPrivacyMessage: z.string().optional().describe("Checkout privacy message"),
        customerAccountsPrivacyMessage: z.string().optional().describe("Customer accounts privacy message"),
        marketingPrivacyMessage: z.string().optional().describe("Marketing privacy message"),
      },
    },
    async ({ gdprApplies, legalPrivacyName, checkoutPrivacyMessage, customerAccountsPrivacyMessage, marketingPrivacyMessage }) => {
      const graphqlQuery = `
        mutation UpdatePrivacySettings($input: PrivacySettingsInput!) {
          privacySettingsUpdate(input: $input) {
            privacy {
              checkout {
                gdprApplies
                legalPrivacyName
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const input: Record<string, unknown> = {};
        if (gdprApplies !== undefined) input.gdprApplies = gdprApplies;
        if (legalPrivacyName) input.legalPrivacyName = legalPrivacyName;
        
        if (checkoutPrivacyMessage || customerAccountsPrivacyMessage || marketingPrivacyMessage) {
          input.privacyOptions = {};
          if (checkoutPrivacyMessage) (input.privacyOptions as Record<string, unknown>).checkoutPrivacyMessage = checkoutPrivacyMessage;
          if (customerAccountsPrivacyMessage) (input.privacyOptions as Record<string, unknown>).customerAccountsPrivacyMessage = customerAccountsPrivacyMessage;
          if (marketingPrivacyMessage) (input.privacyOptions as Record<string, unknown>).marketingPrivacyMessage = marketingPrivacyMessage;
        }

        const result = await client.execute(graphqlQuery, { input });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  server.registerTool(
    "get_visitor_privacy_consent",
    {
      description: "Get visitor privacy consent status",
      inputSchema: {
        visitorId: z.string().describe("Visitor ID"),
      },
    },
    async ({ visitorId }) => {
      const graphqlQuery = `
        query GetVisitorPrivacyConsent($visitorId: ID!) {
          visitor(id: $visitorId) {
            id
            privacy {
              gdprApplies
              marketingConsent {
                grantedAt
                marketingMethod
              }
              preferencesConsent {
                grantedAt
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { visitorId });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );
}
