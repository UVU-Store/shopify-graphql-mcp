import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerInventoryShipmentTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Inventory Shipments
  server.registerTool(
    "get_inventory_shipments",
    {
      description: "Fetch inventory shipments for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of shipments to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetInventoryShipments($first: Int!, $after: String, $query: String, $sortKey: InventoryShipmentSortKeys, $reverse: Boolean) {
          inventoryShipments(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                status
                createdAt
                updatedAt
                completedAt
                displayName
                origin {
                  id
                  address1
                  address2
                  city
                  province
                  country
                  zip
                  name
                }
                destination {
                  id
                  address1
                  address2
                  city
                  province
                  country
                  zip
                  name
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

  // Get Inventory Shipment
  server.registerTool(
    "get_inventory_shipment",
    {
      description: "Fetch a specific inventory shipment by ID",
      inputSchema: {
        id: z.string().describe("Inventory Shipment ID (e.g., 'gid://shopify/InventoryShipment/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetInventoryShipment($id: ID!) {
          inventoryShipment(id: $id) {
            id
            status
            createdAt
            updatedAt
            completedAt
            displayName
            origin {
              id
              address1
              address2
              city
              province
              country
              zip
              name
            }
            destination {
              id
              address1
              address2
              city
              province
              country
              zip
              name
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

  // Create Inventory Shipment
  server.registerTool(
    "create_inventory_shipment",
    {
      description: "Create a new inventory shipment",
      inputSchema: {
        originLocationId: z.string().describe("Origin location ID"),
        destinationLocationId: z.string().describe("Destination location ID"),
        lineItems: z.array(z.object({
          inventoryItemId: z.string().describe("Inventory item ID"),
          quantity: z.number().min(1).describe("Quantity to ship"),
        })).min(1).describe("Line items to ship"),
        displayName: z.string().optional().describe("Display name for the shipment"),
      },
    },
    async ({ originLocationId, destinationLocationId, lineItems, displayName }) => {
      const mutation = `
        mutation InventoryShipmentCreate($input: InventoryShipmentCreateInput!) {
          inventoryShipmentCreate(input: $input) {
            inventoryShipment {
              id
              status
              displayName
              createdAt
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
      if (displayName) input.displayName = displayName;

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

  // Receive Inventory Shipment
  server.registerTool(
    "receive_inventory_shipment",
    {
      description: "Receive items from an inventory shipment",
      inputSchema: {
        shipmentId: z.string().describe("Inventory Shipment ID"),
        lineItems: z.array(z.object({
          inventoryItemId: z.string().describe("Inventory item ID"),
          quantity: z.number().min(1).describe("Quantity received"),
        })).min(1).describe("Line items to receive"),
      },
    },
    async ({ shipmentId, lineItems }) => {
      const mutation = `
        mutation InventoryShipmentReceive($id: ID!, $input: InventoryShipmentReceiveInput!) {
          inventoryShipmentReceive(id: $id, input: $input) {
            inventoryShipment {
              id
              status
              completedAt
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
        const result = await client.execute(mutation, { id: shipmentId, input: { lineItems } });
        
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

  // Get Inventory Shipments Received Items
  server.registerTool(
    "get_inventory_shipments_received_items",
    {
      description: "Fetch inventory items received in shipments",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of items to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        inventoryItemId: z.string().optional().describe("Filter by inventory item ID"),
      },
    },
    async ({ first = 50, after, inventoryItemId }) => {
      const query = `
        query GetInventoryShipmentsReceivedItems($first: Int!, $after: String, $inventoryItemId: ID) {
          inventoryShipmentsReceivedItems(first: $first, after: $after, inventoryItemId: $inventoryItemId) {
            edges {
              node {
                id
                inventoryItem {
                  id
                  sku
                  product {
                    id
                    title
                  }
                }
                shipment {
                  id
                  status
                  displayName
                }
                quantity
                receivedAt
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
        const result = await client.execute(query, { first, after, inventoryItemId });
        
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
