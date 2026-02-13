import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerNavigationTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Menus
  server.registerTool(
    "get_menus",
    {
      description: "Fetch navigation menus for the online store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of menus to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetMenus($first: Int!, $after: String) {
          menus(first: $first, after: $after) {
            edges {
              node {
                id
                title
                handle
                isDefault
                items(limit: 100) {
                  id
                  title
                  url
                  type
                  resourceId
                  tags
                  items {
                    id
                    title
                    url
                    type
                    resourceId
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

  // Get Menu
  server.registerTool(
    "get_menu",
    {
      description: "Fetch a specific menu by ID",
      inputSchema: {
        id: z.string().describe("Menu ID (e.g., 'gid://shopify/Menu/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            title
            handle
            isDefault
            items(limit: 200) {
              id
              title
              url
              type
              resourceId
              tags
              items {
                id
                title
                url
                type
                resourceId
                items {
                  id
                  title
                  url
                  type
                  resourceId
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

  // Create Menu
  server.registerTool(
    "create_menu",
    {
      description: "Create a new navigation menu",
      inputSchema: {
        title: z.string().describe("Menu title"),
        handle: z.string().describe("Unique handle (e.g., 'main-menu')"),
        items: z.array(z.object({
          title: z.string().describe("Item title"),
          url: z.string().optional().describe("Item URL"),
          type: z.string().optional().describe("Item type (e.g., 'PAGE', 'PRODUCT', 'COLLECTION', 'BLOG', 'HTTP')"),
        })).optional().describe("Menu items"),
      },
    },
    async ({ title, handle, items }) => {
      const mutation = `
        mutation MenuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]) {
          menuCreate(title: $title, handle: $handle, items: $items) {
            menu {
              id
              title
              handle
              isDefault
              items(limit: 100) {
                id
                title
                url
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
        const result = await client.execute(mutation, { title, handle, items });
        
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

  // Update Menu
  server.registerTool(
    "update_menu",
    {
      description: "Update an existing navigation menu",
      inputSchema: {
        id: z.string().describe("Menu ID"),
        title: z.string().describe("Menu title"),
        items: z.array(z.object({
          id: z.string().optional().describe("Item ID (for updates)"),
          title: z.string().describe("Item title"),
          url: z.string().optional().describe("Item URL"),
          type: z.string().optional().describe("Item type"),
        })).optional().describe("Menu items"),
      },
    },
    async ({ id, title, items }) => {
      const mutation = `
        mutation MenuUpdate($id: ID!, $title: String!, $items: [MenuItemUpdateInput!]) {
          menuUpdate(id: $id, title: $title, items: $items) {
            menu {
              id
              title
              handle
              items(limit: 100) {
                id
                title
                url
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
        const result = await client.execute(mutation, { id, title, items });
        
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

  // Delete Menu
  server.registerTool(
    "delete_menu",
    {
      description: "Delete a navigation menu",
      inputSchema: {
        id: z.string().describe("Menu ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation MenuDelete($id: ID!) {
          menuDelete(id: $id) {
            deletedMenuId
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
