import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerMetaobjectTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Metaobject Definitions
  server.registerTool(
    "get_metaobject_definitions",
    {
      description: "Fetch metaobject definitions",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of definitions to fetch (default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const graphqlQuery = `
        query GetMetaobjectDefinitions($first: Int!, $after: String) {
          metaobjectDefinitions(first: $first, after: $after) {
            edges {
              node {
                id
                name
                type
                description
                fieldDefinitions {
                  key
                  name
                  description
                  type {
                    name
                  }
                  required
                }
                displayNameKey
                access {
                  admin
                  storefront
                }
                capabilities {
                  publishable {
                    enabled
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

  // Get Metaobjects
  server.registerTool(
    "get_metaobjects",
    {
      description: "Fetch metaobjects of a specific type",
      inputSchema: {
        type: z.string().describe("Metaobject type"),
        first: z.number().min(1).max(250).optional().describe("Number of metaobjects to fetch (default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ type, first = 50, after }) => {
      const graphqlQuery = `
        query GetMetaobjects($type: String!, $first: Int!, $after: String) {
          metaobjects(type: $type, first: $first, after: $after) {
            edges {
              node {
                id
                type
                handle
                displayName
                fields {
                  key
                  value
                  type
                }
                updatedAt
                createdAt
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
        const result = await client.execute(graphqlQuery, { type, first, after });
        
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

  // Create Metaobject
  server.registerTool(
    "create_metaobject",
    {
      description: "Create a new metaobject",
      inputSchema: {
        type: z.string().describe("Metaobject type"),
        handle: z.string().describe("Unique handle for the metaobject"),
        fields: z.array(z.object({
          key: z.string().describe("Field key"),
          value: z.string().describe("Field value"),
        })).describe("Metaobject fields"),
      },
    },
    async ({ type, handle, fields }) => {
      const mutation = `
        mutation MetaobjectCreate($input: MetaobjectCreateInput!) {
          metaobjectCreate(input: $input) {
            metaobject {
              id
              type
              handle
              displayName
              fields {
                key
                value
                type
              }
              updatedAt
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        type,
        handle,
        fields,
      };

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

  // Update Metaobject
  server.registerTool(
    "update_metaobject",
    {
      description: "Update an existing metaobject",
      inputSchema: {
        id: z.string().describe("Metaobject ID"),
        fields: z.array(z.object({
          key: z.string().describe("Field key"),
          value: z.string().describe("Field value"),
        })).describe("Metaobject fields to update"),
      },
    },
    async ({ id, fields }) => {
      const mutation = `
        mutation MetaobjectUpdate($id: ID!, $input: MetaobjectUpdateInput!) {
          metaobjectUpdate(id: $id, input: $input) {
            metaobject {
              id
              type
              handle
              displayName
              fields {
                key
                value
                type
              }
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = { fields };

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

  // Delete Metaobject
  server.registerTool(
    "delete_metaobject",
    {
      description: "Delete a metaobject",
      inputSchema: {
        id: z.string().describe("Metaobject ID"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation MetaobjectDelete($id: ID!) {
          metaobjectDelete(id: $id) {
            deletedId
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
