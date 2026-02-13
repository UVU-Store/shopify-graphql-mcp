import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPublicationTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_publications",
    {
      description: "Fetch publications from the Shopify store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of publications to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        catalogType: z.enum(["APP", "INDIVIDUAL", "CROSS_BORDER", "EXTERNAL"]).optional().describe("Filter by catalog type"),
      },
    },
    async ({ first = 50, after, catalogType }) => {
      const graphqlQuery = `
        query GetPublications($first: Int!, $after: String, $catalogType: CatalogType) {
          publications(first: $first, after: $after, catalogType: $catalogType) {
            edges {
              node {
                id
                name
                autoPublish
                supportsFuturePublishing
                catalog {
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
        const result = await client.execute(graphqlQuery, { first, after, catalogType });
        
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
    "get_publication",
    {
      description: "Fetch a specific publication by ID",
      inputSchema: {
        id: z.string().describe("Publication ID (e.g., 'gid://shopify/Publication/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetPublication($id: ID!) {
          publication(id: $id) {
            id
            name
            autoPublish
            supportsFuturePublishing
            catalog {
              id
              name
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
    "get_publication_products",
    {
      description: "Fetch products published to a publication",
      inputSchema: {
        publicationId: z.string().describe("Publication ID"),
        first: z.number().min(1).max(250).optional().describe("Number of products to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ publicationId, first = 50, after }) => {
      const graphqlQuery = `
        query GetPublicationProducts($id: ID!, $first: Int!, $after: String) {
          publication(id: $id) {
            id
            name
            products(first: $first, after: $after) {
              edges {
                node {
                  id
                  title
                  handle
                  createdAt
                  productType
                  vendor
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id: publicationId, first, after });
        
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
    "get_publication_collections",
    {
      description: "Fetch collections published to a publication",
      inputSchema: {
        publicationId: z.string().describe("Publication ID"),
        first: z.number().min(1).max(250).optional().describe("Number of collections to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ publicationId, first = 50, after }) => {
      const graphqlQuery = `
        query GetPublicationCollections($id: ID!, $first: Int!, $after: String) {
          publication(id: $id) {
            id
            name
            collections(first: $first, after: $after) {
              edges {
                node {
                  id
                  title
                  handle
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
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id: publicationId, first, after });
        
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
