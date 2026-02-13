import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerScriptTagTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_script_tags",
    {
      description: "Fetch script tags from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of script tags to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        src: z.string().optional().describe("Filter by source URL"),
      },
    },
    async ({ first = 50, after, src }) => {
      const graphqlQuery = `
        query GetScriptTags($first: Int!, $after: String, $src: URL) {
          scriptTags(first: $first, after: $after, src: $src) {
            edges {
              node {
                id
                src
                displayScope
                cache
                createdAt
                updatedAt
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
        const result = await client.execute(graphqlQuery, { first, after, src });
        
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
    "get_script_tag",
    {
      description: "Fetch a specific script tag by ID",
      inputSchema: {
        id: z.string().describe("Script tag ID (e.g., 'gid://shopify/ScriptTag/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetScriptTag($id: ID!) {
          scriptTag(id: $id) {
            id
            src
            displayScope
            cache
            createdAt
            updatedAt
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
    "create_script_tag",
    {
      description: "Create a new script tag",
      inputSchema: {
        src: z.string().url().describe("URL to the remote script"),
        displayScope: z.enum(["ALL", "ONLINE_STORE", "ORDER_STATUS"]).optional().describe("Page(s) where the script should be included"),
        cache: z.boolean().optional().describe("Whether the script can be cached by the CDN"),
      },
    },
    async ({ src, displayScope = "ALL", cache = false }) => {
      const graphqlQuery = `
        mutation CreateScriptTag($input: ScriptTagInput!) {
          scriptTagCreate(input: $input) {
            scriptTag {
              id
              src
              displayScope
              cache
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { 
          input: { src, displayScope, cache } 
        });
        
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
    "update_script_tag",
    {
      description: "Update an existing script tag",
      inputSchema: {
        id: z.string().describe("Script tag ID (e.g., 'gid://shopify/ScriptTag/123456789')"),
        src: z.string().url().optional().describe("URL to the remote script"),
        displayScope: z.enum(["ALL", "ONLINE_STORE", "ORDER_STATUS"]).optional().describe("Page(s) where the script should be included"),
        cache: z.boolean().optional().describe("Whether the script can be cached by the CDN"),
      },
    },
    async ({ id, src, displayScope, cache }) => {
      const graphqlQuery = `
        mutation UpdateScriptTag($id: ID!, $input: ScriptTagInput!) {
          scriptTagUpdate(id: $id, input: $input) {
            scriptTag {
              id
              src
              displayScope
              cache
              updatedAt
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
        if (src) input.src = src;
        if (displayScope) input.displayScope = displayScope;
        if (cache !== undefined) input.cache = cache;

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
    "delete_script_tag",
    {
      description: "Delete a script tag",
      inputSchema: {
        id: z.string().describe("Script tag ID (e.g., 'gid://shopify/ScriptTag/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        mutation DeleteScriptTag($id: ID!) {
          scriptTagDelete(id: $id) {
            deletedScriptTagId
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
