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

  // Create Metaobject Definition
  server.registerTool(
    "create_metaobject_definition",
    {
      description: "Create a new metaobject definition that establishes the structure for custom data objects",
      inputSchema: {
        name: z.string().describe("Display name for the metaobject definition"),
        type: z.string().describe("Unique type identifier (use $app: prefix for app-exclusive definitions)"),
        description: z.string().optional().describe("Description of the metaobject definition"),
        fieldDefinitions: z.array(z.object({
          key: z.string().describe("Field key identifier"),
          name: z.string().describe("Field display name"),
          type: z.enum(["single_line_text_field", "multi_line_text_field", "single_line_text_field", "number_integer", "number_decimal", "boolean", "url", "email", "phone", "date", "date_time", "json", "color", "page_reference", "product_reference", "variant_reference", "collection_reference", "customer_reference", "company_reference", "file_reference", "mixed_reference", "rating"]).describe("Field type"),
          required: z.boolean().optional().describe("Whether the field is required"),
          description: z.string().optional().describe("Field description"),
        })).describe("Field definitions for the metaobject"),
        displayNameKey: z.string().optional().describe("Key of the field to use as display name"),
      },
    },
    async ({ name, type, description, fieldDefinitions, displayNameKey }) => {
      const mutation = `
        mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
          metaobjectDefinitionCreate(definition: $definition) {
            metaobjectDefinition {
              id
              name
              type
              description
              fieldDefinitions {
                key
                name
                type {
                  name
                }
                required
              }
              displayNameKey
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const definition: Record<string, unknown> = { name, type };
      if (description) definition.description = description;
      if (fieldDefinitions) definition.fieldDefinitions = fieldDefinitions;
      if (displayNameKey) definition.displayNameKey = displayNameKey;

      try {
        const result = await client.execute(mutation, { definition });

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

  // Update Metaobject Definition
  server.registerTool(
    "update_metaobject_definition",
    {
      description: "Update an existing metaobject definition",
      inputSchema: {
        id: z.string().describe("Metaobject Definition ID"),
        name: z.string().optional().describe("Display name for the metaobject definition"),
        description: z.string().optional().describe("Description of the metaobject definition"),
        displayNameKey: z.string().optional().describe("Key of the field to use as display name"),
      },
    },
    async ({ id, name, description, displayNameKey }) => {
      const mutation = `
        mutation MetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
          metaobjectDefinitionUpdate(id: $id, definition: $definition) {
            metaobjectDefinition {
              id
              name
              type
              description
              displayNameKey
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const definition: Record<string, unknown> = {};
      if (name) definition.name = name;
      if (description !== undefined) definition.description = description;
      if (displayNameKey !== undefined) definition.displayNameKey = displayNameKey;

      try {
        const result = await client.execute(mutation, { id, definition });

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

  // Delete Metaobject Definition
  server.registerTool(
    "delete_metaobject_definition",
    {
      description: "Delete a metaobject definition. Also deletes all related metafield definitions, metaobjects, and metafields asynchronously.",
      inputSchema: {
        id: z.string().describe("Metaobject Definition ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation MetaobjectDefinitionDelete($id: ID!) {
          metaobjectDefinitionDelete(id: $id) {
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
