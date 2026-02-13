import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerMarketTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Markets
  server.registerTool(
    "get_markets",
    {
      description: "Fetch markets configured for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of markets to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetMarkets($first: Int!, $after: String) {
          markets(first: $first, after: $after) {
            edges {
              node {
                id
                name
                handle
                status
                supportedLocales {
                  locale
                  enabled
                }
                currencies {
                  currencyCode
                  exchangeRate
                  format
                }
                priceListByContext {
                  id
                  name
                }
                webPresences(first: 10) {
                  edges {
                    node {
                      id
                      domain
                      launchAt
                      alternateLocales
                    }
                  }
                }
                regions(first: 10) {
                  edges {
                    node {
                      id
                      name
                      code
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
        const result = await client.execute(query, { first, after });
        
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

  // Get Market
  server.registerTool(
    "get_market",
    {
      description: "Fetch a specific market by ID",
      inputSchema: {
        id: z.string().describe("Market ID (e.g., 'gid://shopify/Market/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetMarket($id: ID!) {
          market(id: $id) {
            id
            name
            handle
            status
            supportedLocales {
              locale
              enabled
            }
            currencies {
              currencyCode
              exchangeRate
              format
            }
            priceListByContext {
              id
              name
            }
            webPresences(first: 20) {
              edges {
                node {
                  id
                  domain
                  launchAt
                  alternateLocales
                  defaultLocale
                }
              }
            }
            regions(first: 20) {
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
      `;

      try {
        const result = await client.execute(query, { id });
        
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

  // Create Market
  server.registerTool(
    "create_market",
    {
      description: "Create a new market",
      inputSchema: {
        name: z.string().describe("Market name"),
        handle: z.string().describe("Unique handle for the market"),
      },
    },
    async ({ name, handle }) => {
      const mutation = `
        mutation MarketCreate($input: MarketCreateInput!) {
          marketCreate(input: $input) {
            market {
              id
              name
              handle
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = { name, handle };

      try {
        const result = await client.execute(mutation, { input });
        
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

  // Update Market
  server.registerTool(
    "update_market",
    {
      description: "Update an existing market",
      inputSchema: {
        id: z.string().describe("Market ID"),
        name: z.string().optional().describe("Market name"),
        handle: z.string().optional().describe("Handle"),
      },
    },
    async ({ id, name, handle }) => {
      const mutation = `
        mutation MarketUpdate($id: ID!, $input: MarketUpdateInput!) {
          marketUpdate(id: $id, input: $input) {
            market {
              id
              name
              handle
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = {};
      if (name) input.name = name;
      if (handle) input.handle = handle;

      try {
        const result = await client.execute(mutation, { id, input });
        
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

  // Delete Market
  server.registerTool(
    "delete_market",
    {
      description: "Delete a market",
      inputSchema: {
        id: z.string().describe("Market ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation MarketDelete($id: ID!) {
          marketDelete(id: $id) {
            deletedMarketId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { id });
        
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

  // Get Markets Home
  server.registerTool(
    "get_markets_home",
    {
      description: "Fetch markets home data and analytics",
      inputSchema: {},
    },
    async () => {
      const query = `
        query GetMarketsHome {
          marketsHome {
            totalMarkets
            totalRevenue
            topMarkets(first: 10) {
              marketId
              marketName
              totalOrders
              totalSales
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, {});
        
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
