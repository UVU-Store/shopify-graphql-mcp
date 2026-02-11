import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerShopTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Shop Info
  server.registerTool(
    "get_shop_info",
    {
      description: "Fetch general shop information",
      inputSchema: {},
    },
    async () => {
      const graphqlQuery = `
        query GetShop {
          shop {
            id
            name
            email
            contactEmail
            myshopifyDomain
            primaryDomain {
              url
              host
            }
            currencyCode
            ianaTimezone
            timezoneAbbreviation
            createdAt
            updatedAt
            checkoutApiSupported
            taxesIncluded
            taxShipping
            customerAccounts
            marketingSmsConsentEnabledAtCheckout
            shipsToCountries
            plan {
              displayName
              partnerDevelopment
              shopifyPlus
            }
            billingAddress {
              address1
              city
              province
              country
              zip
              phone
            }
            features {
              storefront
              reports
              giftCards
              bundles {
                enabled
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery);
        
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

  // Get Shop Policies
  server.registerTool(
    "get_shop_policies",
    {
      description: "Fetch shop policies (refund, privacy, terms of service, etc.)",
      inputSchema: {},
    },
    async () => {
      const graphqlQuery = `
        query GetShopPolicies {
          shop {
            shopPolicies {
              id
              type
              title
              body
              url
              createdAt
              updatedAt
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery);
        
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

  // Execute ShopifyQL Query
  server.registerTool(
    "shopifyql_query",
    {
      description: "Execute a ShopifyQL query for analytics (requires read_analytics scope)",
      inputSchema: {
        query: z.string().describe("ShopifyQL query string"),
      },
    },
    async ({ query }) => {
      const graphqlQuery = `
        query ShopifyQL($query: String!) {
          shopifyqlQuery(query: $query) {
            parseError
            tableData {
              columns {
                name
                dataType
                displayName
              }
              rows
              rowCount
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { query });
        
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
