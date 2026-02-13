import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerInventoryTransferTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Inventory Transfers
  server.registerTool(
    "get_inventory_transfers",
    {
      description: "Fetch inventory transfers between locations",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of transfers to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'status:pending', 'item:sku123')"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetInventoryTransfers($first: Int!, $after: String, $query: String, $sortKey: InventoryTransferSortKeys, $reverse: Boolean) {
          inventoryTransfers(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                status
                createdAt
                updatedAt
                completedAt
                sentAt
                receivedAt
                originLocation {
                  id
                  name
                  address {
                    address1
                    city
                    province
                    country
                    zip
                  }
                }
                destinationLocation {
                  id
                  name
                  address {
                    address1
                    city
                    province
                    country
                    zip
                  }
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      sku
                      quantity
                      expectedQuantity
                      receivedQuantity
                      inventoryItem {
                        id
                        sku
                        product {
                          id
                          title
                        }
                      }
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
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Get Inventory Transfer
  server.registerTool(
    "get_inventory_transfer",
    {
      description: "Fetch a specific inventory transfer by ID",
      inputSchema: {
        id: z.string().describe("Inventory Transfer ID (e.g., 'gid://shopify/InventoryTransfer/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetInventoryTransfer($id: ID!) {
          inventoryTransfer(id: $id) {
            id
            status
            createdAt
            updatedAt
            completedAt
            sentAt
            receivedAt
            originLocation {
              id
              name
              address {
                address1
                address2
                city
                province
                country
                zip
              }
            }
            destinationLocation {
              id
              name
              address {
                address1
                address2
                city
                province
                country
                zip
              }
            }
            lineItems(first: 100) {
              edges {
                node {
                  id
                  sku
                  quantity
                  expectedQuantity
                  receivedQuantity
                  inventoryItem {
                    id
                    sku
                    product {
                      id
                      title
                      variants(first: 10) {
                        edges {
                          node {
                            id
                            title
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id });
        
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

  // Create Inventory Transfer
  server.registerTool(
    "create_inventory_transfer",
    {
      description: "Create a new inventory transfer between locations",
      inputSchema: {
        originLocationId: z.string().describe("Origin location ID"),
        destinationLocationId: z.string().describe("Destination location ID"),
        lineItems: z.array(z.object({
          inventoryItemId: z.string().describe("Inventory item ID"),
          quantity: z.number().min(1).describe("Quantity to transfer"),
        })).min(1).describe("Line items to transfer"),
      },
    },
    async ({ originLocationId, destinationLocationId, lineItems }) => {
      const mutation = `
        mutation InventoryTransferCreate($input: InventoryTransferCreateInput!) {
          inventoryTransferCreate(input: $input) {
            inventoryTransfer {
              id
              status
              createdAt
              originLocation {
                id
                name
              }
              destinationLocation {
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

      const input: Record<string, unknown> = {
        originLocationId,
        destinationLocationId,
        lineItems,
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

  // Receive Inventory Transfer
  server.registerTool(
    "receive_inventory_transfer",
    {
      description: "Receive items from an inventory transfer",
      inputSchema: {
        transferId: z.string().describe("Inventory Transfer ID"),
        lineItems: z.array(z.object({
          inventoryItemId: z.string().describe("Inventory item ID"),
          quantity: z.number().min(1).describe("Quantity received"),
        })).min(1).describe("Line items to receive"),
      },
    },
    async ({ transferId, lineItems }) => {
      const mutation = `
        mutation InventoryTransferReceive($id: ID!, $input: InventoryTransferReceiveInput!) {
          inventoryTransferReceive(id: $id, input: $input) {
            inventoryTransfer {
              id
              status
              completedAt
              receivedAt
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    receivedQuantity
                  }
                }
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
        const result = await client.execute(mutation, { id: transferId, input: { lineItems } });
        
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
