import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPageTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Pages
  server.registerTool(
    "get_pages",
    {
      description: "Fetch online store pages",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of pages to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query"),
        sortKey: z.enum(["TITLE", "CREATED_AT", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetPages($first: Int!, $after: String, $query: String, $sortKey: PageSortKeys, $reverse: Boolean) {
          pages(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                title
                handle
                url
                body
                bodySummary
                createdAt
                updatedAt
                publishedAt
                shop {
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

  // Get Page
  server.registerTool(
    "get_page",
    {
      description: "Fetch a specific page by ID",
      inputSchema: {
        id: z.string().describe("Page ID (e.g., 'gid://shopify/Page/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetPage($id: ID!) {
          page(id: $id) {
            id
            title
            handle
            url
            body
            bodySummary
            createdAt
            updatedAt
            publishedAt
            shop {
              id
              name
            }
            seo {
              title
              description
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

  // Create Page
  server.registerTool(
    "create_page",
    {
      description: "Create a new online store page",
      inputSchema: {
        title: z.string().describe("Page title"),
        body: z.string().describe("Page content (HTML or plain text)"),
        handle: z.string().optional().describe("URL handle (auto-generated if not provided)"),
        published: z.boolean().optional().describe("Publish the page immediately"),
      },
    },
    async ({ title, body, handle, published = false }) => {
      const mutation = `
        mutation PageCreate($input: PageInput!) {
          pageCreate(input: $input) {
            page {
              id
              title
              handle
              url
              body
              publishedAt
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { title, body };
      if (handle) input.handle = handle;
      if (published) input.publishedAt = new Date().toISOString();

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

  // Update Page
  server.registerTool(
    "update_page",
    {
      description: "Update an existing page",
      inputSchema: {
        id: z.string().describe("Page ID"),
        title: z.string().optional().describe("Page title"),
        body: z.string().optional().describe("Page content"),
        handle: z.string().optional().describe("URL handle"),
        published: z.boolean().optional().describe("Publish/unpublish the page"),
      },
    },
    async ({ id, title, body, handle, published }) => {
      const mutation = `
        mutation PageUpdate($id: ID!, $input: PageInput!) {
          pageUpdate(id: $id, input: $input) {
            page {
              id
              title
              handle
              url
              body
              publishedAt
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
      if (body) input.body = body;
      if (handle) input.handle = handle;
      if (published !== undefined) {
        input.publishedAt = published ? new Date().toISOString() : null;
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

  // Delete Page
  server.registerTool(
    "delete_page",
    {
      description: "Delete a page",
      inputSchema: {
        id: z.string().describe("Page ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation PageDelete($id: ID!) {
          pageDelete(id: $id) {
            deletedPageId
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
