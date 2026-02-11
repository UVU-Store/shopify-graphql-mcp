import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCustomPixelTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Custom Pixels
  server.registerTool(
    "get_custom_pixels",
    {
      description: "Fetch custom pixels configured for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of pixels to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetCustomPixels($first: Int!, $after: String) {
          customPixels(first: $first, after: $after) {
            edges {
              node {
                id
                handle
                title
                source
                status
                settings
                createdAt
                updatedAt
                lastError
                lastErrorAt
                shopifyManaged
                apiClient {
                  id
                  title
                }
                events {
                  id
                  name
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

  // Get Custom Pixel
  server.registerTool(
    "get_custom_pixel",
    {
      description: "Fetch a specific custom pixel by ID",
      inputSchema: {
        id: z.string().describe("Custom Pixel ID (e.g., 'gid://shopify/CustomPixel/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetCustomPixel($id: ID!) {
          customPixel(id: $id) {
            id
            handle
            title
            source
            status
            settings
            createdAt
            updatedAt
            lastError
            lastErrorAt
            shopifyManaged
            apiClient {
              id
              title
            }
            events {
              id
              name
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

  // Create Custom Pixel
  server.registerTool(
    "create_custom_pixel",
    {
      description: "Create a new custom pixel",
      inputSchema: {
        title: z.string().describe("Pixel title"),
        handle: z.string().describe("Unique handle for the pixel"),
        source: z.string().describe("JavaScript source code for the pixel"),
        settings: z.string().optional().describe("JSON settings for the pixel"),
        events: z.array(z.string()).optional().describe("Events to subscribe to (e.g., ['checkout_started', 'checkout_completed'])"),
      },
    },
    async ({ title, handle, source, settings, events }) => {
      const mutation = `
        mutation CustomPixelCreate($input: CustomPixelInput!) {
          customPixelCreate(input: $input) {
            customPixel {
              id
              handle
              title
              source
              status
              settings
              createdAt
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { title, handle, source };
      if (settings) input.settings = settings;
      if (events && events.length > 0) input.events = events;

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

  // Update Custom Pixel
  server.registerTool(
    "update_custom_pixel",
    {
      description: "Update an existing custom pixel",
      inputSchema: {
        id: z.string().describe("Custom Pixel ID"),
        title: z.string().optional().describe("Pixel title"),
        source: z.string().optional().describe("JavaScript source code"),
        settings: z.string().optional().describe("JSON settings"),
        events: z.array(z.string()).optional().describe("Events to subscribe to"),
      },
    },
    async ({ id, title, source, settings, events }) => {
      const mutation = `
        mutation CustomPixelUpdate($id: ID!, $input: CustomPixelInput!) {
          customPixelUpdate(id: $id, input: $input) {
            customPixel {
              id
              handle
              title
              source
              status
              settings
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = {};
      if (title) input.title = title;
      if (source) input.source = source;
      if (settings !== undefined) input.settings = settings;
      if (events && events.length > 0) input.events = events;

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

  // Delete Custom Pixel
  server.registerTool(
    "delete_custom_pixel",
    {
      description: "Delete a custom pixel",
      inputSchema: {
        id: z.string().describe("Custom Pixel ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation CustomPixelDelete($id: ID!) {
          customPixelDelete(id: $id) {
            deletedCustomPixelId
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

  // Toggle Custom Pixel Status
  server.registerTool(
    "toggle_custom_pixel",
    {
      description: "Enable or disable a custom pixel",
      inputSchema: {
        id: z.string().describe("Custom Pixel ID"),
        enabled: z.boolean().describe("Whether to enable (true) or disable (false) the pixel"),
      },
    },
    async ({ id, enabled }) => {
      const mutation = enabled
        ? `
          mutation CustomPixelEnable($id: ID!) {
            customPixelEnable(id: $id) {
              customPixel {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }
        `
        : `
          mutation CustomPixelDisable($id: ID!) {
            customPixelDisable(id: $id) {
              customPixel {
                id
                status
              }
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
