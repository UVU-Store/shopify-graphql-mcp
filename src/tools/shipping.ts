import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerShippingTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_shipping_zones",
    {
      description: "Fetch shipping zones from the Shopify store",
      inputSchema: {},
    },
    async () => {
      const graphqlQuery = `
        query GetShippingZones {
          shippingZones {
            edges {
              node {
                id
                name
                countries(first: 50) {
                  edges {
                    node {
                      id
                      name
                      code
                    }
                  }
                }
              }
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
    "get_delivery_profiles",
    {
      description: "Fetch delivery profiles",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of profiles to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const graphqlQuery = `
        query GetDeliveryProfiles($first: Int!, $after: String) {
          deliveryProfiles(first: $first, after: $after) {
            edges {
              node {
                id
                name
                active
                locationGroups(first: 10) {
                  edges {
                    node {
                      id
                      locations(first: 10) {
                        edges {
                          node {
                            id
                            name
                          }
                        }
                      }
                    }
                  }
                }
                methods(first: 10) {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after });
        
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
    "get_delivery_carriers",
    {
      description: "Fetch delivery carrier services",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of carriers to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const graphqlQuery = `
        query GetDeliveryCarriers($first: Int!, $after: String) {
          carrierServices(first: $first, after: $after) {
            edges {
              node {
                id
                name
                active
                serviceName
                format
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after });
        
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
    "get_shipping_countries",
    {
      description: "Fetch available shipping countries",
      inputSchema: {},
    },
    async () => {
      const graphqlQuery = `
        query GetShippingCountries {
          countries(first: 250) {
            edges {
              node {
                id
                name
                code
                currencyCode
                provinces(first: 50) {
                  edges {
                    node {
                      id
                      name
                      code
                    }
                  }
                }
              }
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
}
