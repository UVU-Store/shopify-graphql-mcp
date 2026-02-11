import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerInventoryTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Inventory Levels
  server.registerTool(
    "get_inventory",
    {
      description: "Fetch inventory levels for products",
      inputSchema: {
        locationId: z.string().optional().describe("Filter by location ID"),
        query: z.string().optional().describe("Filter query"),
        first: z.number().min(1).max(250).optional().describe("Number of items to fetch (default: 50)"),
      },
    },
    async ({ locationId, query, first = 50 }) => {
      const graphqlQuery = `
        query GetInventory($first: Int!, $query: String) {
          inventoryItems(first: $first, query: $query) {
            edges {
              node {
                id
                sku
                variant {
                  id
                  title
                  product {
                    id
                    title
                  }
                }
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      id
                      available
                      location {
                        id
                        name
                      }
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, query });
        
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

  // Adjust Inventory
  server.registerTool(
    "adjust_inventory",
    {
      description: "Adjust inventory quantities",
      inputSchema: {
        inventoryItemId: z.string().describe("Inventory item ID"),
        locationId: z.string().describe("Location ID"),
        availableDelta: z.number().describe("Quantity adjustment (positive or negative)"),
      },
    },
    async ({ inventoryItemId, locationId, availableDelta }) => {
      const mutation = `
        mutation InventoryAdjustQuantity($input: InventoryAdjustQuantityInput!) {
          inventoryAdjustQuantity(input: $input) {
            inventoryLevel {
              id
              available
              location {
                id
                name
              }
              item {
                id
                sku
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        inventoryLevelId: `gid://shopify/InventoryLevel/${inventoryItemId}?location_id=${locationId}`,
        availableDelta,
      };

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

  // Set Inventory On Hand
  server.registerTool(
    "set_inventory",
    {
      description: "Set on-hand inventory quantity",
      inputSchema: {
        inventoryItemId: z.string().describe("Inventory item ID"),
        locationId: z.string().describe("Location ID"),
        quantity: z.number().min(0).describe("New on-hand quantity"),
      },
    },
    async ({ inventoryItemId, locationId, quantity }) => {
      const mutation = `
        mutation InventorySetOnHand($input: InventorySetOnHandInput!) {
          inventorySetOnHandQuantities(input: $input) {
            inventoryLevel {
              id
              available
              onHand
              location {
                id
                name
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        reason: "correction",
        quantities: [{
          inventoryItemId,
          locationId,
          quantity,
        }],
      };

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
}
