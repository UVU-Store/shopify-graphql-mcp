import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCartTransformTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Cart Transforms
  server.registerTool(
    "get_cart_transforms",
    {
      description: "Fetch cart transforms configured for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of transforms to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetCartTransforms($first: Int!, $after: String) {
          cartTransforms(first: $first, after: $after) {
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

  // Get All Cart Transforms (includes inactive)
  server.registerTool(
    "get_all_cart_transforms",
    {
      description: "Fetch all cart transforms including inactive ones",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of transforms to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        includeInactive: z.boolean().optional().describe("Include inactive transforms"),
      },
    },
    async ({ first = 50, after, includeInactive = true }) => {
      const query = `
        query GetAllCartTransforms($first: Int!, $after: String, $includeInactive: Boolean) {
          allCartTransforms(first: $first, after: $after, includeInactive: $includeInactive) {
            edges {
              node {
                id
                functionId
                status
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
        const result = await client.execute(query, { first, after, includeInactive });
        
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

  // Create Cart Transform
  server.registerTool(
    "create_cart_transform",
    {
      description: "Create a new cart transform using a Shopify Function",
      inputSchema: {
        functionId: z.string().describe("ID of the cart transform function to use"),
        metafields: z.array(z.object({
          namespace: z.string().describe("Metafield namespace"),
          key: z.string().describe("Metafield key"),
          value: z.string().describe("Metafield value"),
          type: z.string().describe("Metafield type"),
        })).optional().describe("Configuration metafields for the function"),
      },
    },
    async ({ functionId, metafields }) => {
      const mutation = `
        mutation CartTransformCreate($input: CartTransformInput!) {
          cartTransformCreate(input: $input) {
            cartTransform {
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

  // Update Cart Transform
  server.registerTool(
    "update_cart_transform",
    {
      description: "Update an existing cart transform",
      inputSchema: {
        id: z.string().describe("Cart Transform ID"),
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
        mutation CartTransformUpdate($id: ID!, $input: CartTransformInput!) {
          cartTransformUpdate(id: $id, input: $input) {
            cartTransform {
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

  // Delete Cart Transform
  server.registerTool(
    "delete_cart_transform",
    {
      description: "Delete a cart transform",
      inputSchema: {
        id: z.string().describe("Cart Transform ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation CartTransformDelete($id: ID!) {
          cartTransformDelete(id: $id) {
            deletedCartTransformId
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
