import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPixelTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_pixels",
    {
      description: "Fetch pixels from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of pixels to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const graphqlQuery = `
        query GetPixels($first: Int!, $after: String) {
          pixels(first: $first, after: $after) {
            edges {
              node {
                id
                name
                apiKey
                enabled
                events(first: 10) {
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
    "get_pixel",
    {
      description: "Fetch a specific pixel by ID",
      inputSchema: {
        id: z.string().describe("Pixel ID (e.g., 'gid://shopify/Pixel/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetPixel($id: ID!) {
          pixel(id: $id) {
            id
            name
            apiKey
            enabled
            events(first: 50) {
              edges {
                node {
                  id
                  name
                  schema
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

  server.registerTool(
    "create_pixel",
    {
      description: "Create a new pixel",
      inputSchema: {
        name: z.string().describe("Pixel name"),
        apiKey: z.string().describe("Pixel API key"),
      },
    },
    async ({ name, apiKey }) => {
      const graphqlQuery = `
        mutation CreatePixel($input: PixelInput!) {
          pixelCreate(input: $input) {
            pixel {
              id
              name
              apiKey
              enabled
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { input: { name, apiKey } });
        
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
    "update_pixel",
    {
      description: "Update an existing pixel",
      inputSchema: {
        id: z.string().describe("Pixel ID (e.g., 'gid://shopify/Pixel/123456789')"),
        name: z.string().optional().describe("Pixel name"),
        apiKey: z.string().optional().describe("Pixel API key"),
        enabled: z.boolean().optional().describe("Whether the pixel is enabled"),
      },
    },
    async ({ id, name, apiKey, enabled }) => {
      const graphqlQuery = `
        mutation UpdatePixel($id: ID!, $input: PixelInput!) {
          pixelUpdate(id: $id, input: $input) {
            pixel {
              id
              name
              apiKey
              enabled
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
        if (name) input.name = name;
        if (apiKey) input.apiKey = apiKey;
        if (enabled !== undefined) input.enabled = enabled;

        const result = await client.execute(graphqlQuery, { id, input });
        
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
    "delete_pixel",
    {
      description: "Delete a pixel",
      inputSchema: {
        id: z.string().describe("Pixel ID (e.g., 'gid://shopify/Pixel/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        mutation DeletePixel($id: ID!) {
          pixelDelete(id: $id) {
            deletedPixelId
            userErrors {
              field
              message
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
}
