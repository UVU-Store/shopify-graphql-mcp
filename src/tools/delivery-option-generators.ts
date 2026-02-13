import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerDeliveryOptionGeneratorTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Delivery Option Generators
  server.registerTool(
    "get_delivery_option_generators",
    {
      description: "Fetch delivery option generator configurations",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetDeliveryOptionGenerators($first: Int!, $after: String) {
          deliveryOptionGenerators(first: $first, after: $after) {
            edges {
              node {
                id
                functionId
                metafields(first: 10) {
                  edges {
                    node {
                      id
                      namespace
                      key
                      value
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

  // Create Delivery Option Generator
  server.registerTool(
    "create_delivery_option_generator",
    {
      description: "Create a new delivery option generator using a Shopify Function",
      inputSchema: {
        functionId: z.string().describe("ID of the delivery option generator function"),
        metafields: z.array(z.object({
          namespace: z.string().describe("Metafield namespace"),
          key: z.string().describe("Metafield key"),
          value: z.string().describe("Metafield value"),
          type: z.string().describe("Metafield type"),
        })).optional().describe("Configuration metafields"),
      },
    },
    async ({ functionId, metafields }) => {
      const mutation = `
        mutation DeliveryOptionGeneratorCreate($input: DeliveryOptionGeneratorInput!) {
          deliveryOptionGeneratorCreate(input: $input) {
            deliveryOptionGenerator {
              id
              functionId
              metafields(first: 10) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
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

      const input: Record<string, unknown> = { functionId };
      if (metafields && metafields.length > 0) {
        input.metafields = metafields;
      }

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

  // Update Delivery Option Generator
  server.registerTool(
    "update_delivery_option_generator",
    {
      description: "Update an existing delivery option generator",
      inputSchema: {
        id: z.string().describe("Delivery Option Generator ID"),
        metafields: z.array(z.object({
          namespace: z.string().describe("Metafield namespace"),
          key: z.string().describe("Metafield key"),
          value: z.string().describe("Metafield value"),
          type: z.string().describe("Metafield type"),
        })).optional().describe("Updated configuration metafields"),
      },
    },
    async ({ id, metafields }) => {
      const mutation = `
        mutation DeliveryOptionGeneratorUpdate($id: ID!, $input: DeliveryOptionGeneratorInput!) {
          deliveryOptionGeneratorUpdate(id: $id, input: $input) {
            deliveryOptionGenerator {
              id
              functionId
              metafields(first: 10) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
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

      const input: Record<string, unknown> = {};
      if (metafields && metafields.length > 0) {
        input.metafields = metafields;
      }

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

  // Delete Delivery Option Generator
  server.registerTool(
    "delete_delivery_option_generator",
    {
      description: "Delete a delivery option generator",
      inputSchema: {
        id: z.string().describe("Delivery Option Generator ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation DeliveryOptionGeneratorDelete($id: ID!) {
          deliveryOptionGeneratorDelete(id: $id) {
            deletedDeliveryOptionGeneratorId
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
}
