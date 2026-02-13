import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerNavigationTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Navigations (Menus)
  server.registerTool(
    "get_navigations",
    {
      description: "Fetch navigation menus for the online store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of navigations to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetNavigations($first: Int!, $after: String) {
          navigations(first: $first, after: $after) {
            edges {
              node {
                id
                title
                handle
                items(first: 100) {
                  edges {
                    node {
                      id
                      title
                      url
                      type
                      items(first: 50) {
                        edges {
                          node {
                            id
                            title
                            url
                            type
                          }
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

  // Get Navigation
  server.registerTool(
    "get_navigation",
    {
      description: "Fetch a specific navigation menu by handle",
      inputSchema: {
        handle: z.string().describe("Navigation handle (e.g., 'main-menu', 'footer')"),
      },
    },
    async ({ handle }) => {
      const query = `
        query GetNavigation($handle: String!) {
          navigation(handle: $handle) {
            id
            title
            handle
            items(first: 200) {
              edges {
                node {
                  id
                  title
                  url
                  type
                  items(first: 100) {
                    edges {
                      node {
                        id
                        title
                        url
                        type
                        items(first: 50) {
                          edges {
                            node {
                              id
                              title
                              url
                              type
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
        }
      `;

      try {
        const result = await client.execute(query, { handle });
        
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

  // Create Navigation
  server.registerTool(
    "create_navigation",
    {
      description: "Create a new navigation menu",
      inputSchema: {
        title: z.string().describe("Navigation title"),
        handle: z.string().describe("Unique handle (e.g., 'main-menu')"),
        items: z.array(z.object({
          title: z.string().describe("Item title"),
          url: z.string().describe("Item URL"),
          type: z.string().optional().describe("Item type (e.g., 'link', 'product', 'collection')"),
        })).optional().describe("Navigation items"),
      },
    },
    async ({ title, handle, items }) => {
      const mutation = `
        mutation NavigationCreate($input: NavigationInput!) {
          navigationCreate(input: $input) {
            navigation {
              id
              title
              handle
              items(first: 100) {
                edges {
                  node {
                    id
                    title
                    url
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

      const input: Record<string, unknown> = { title, handle };
      if (items && items.length > 0) {
        input.items = items;
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

  // Update Navigation
  server.registerTool(
    "update_navigation",
    {
      description: "Update an existing navigation menu",
      inputSchema: {
        id: z.string().describe("Navigation ID"),
        title: z.string().optional().describe("Navigation title"),
        items: z.array(z.object({
          title: z.string().describe("Item title"),
          url: z.string().describe("Item URL"),
          type: z.string().optional().describe("Item type"),
        })).optional().describe("Navigation items"),
      },
    },
    async ({ id, title, items }) => {
      const mutation = `
        mutation NavigationUpdate($id: ID!, $input: NavigationInput!) {
          navigationUpdate(id: $id, input: $input) {
            navigation {
              id
              title
              handle
              items(first: 100) {
                edges {
                  node {
                    id
                    title
                    url
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
      if (title) input.title = title;
      if (items && items.length > 0) input.items = items;

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

  // Delete Navigation
  server.registerTool(
    "delete_navigation",
    {
      description: "Delete a navigation menu",
      inputSchema: {
        id: z.string().describe("Navigation ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation NavigationDelete($id: ID!) {
          navigationDelete(id: $id) {
            deletedNavigationId
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
