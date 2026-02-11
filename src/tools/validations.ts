import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerValidationTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Validations
  server.registerTool(
    "get_validations",
    {
      description: "Fetch cart and checkout validation rules",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of validations to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetValidations($first: Int!, $after: String) {
          validations(first: $first, after: $after) {
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

  // Create Validation
  server.registerTool(
    "create_validation",
    {
      description: "Create a new cart/checkout validation rule using a Shopify Function",
      inputSchema: {
        functionId: z.string().describe("ID of the validation function to use"),
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
        mutation ValidationCreate($input: ValidationInput!) {
          validationCreate(input: $input) {
            validation {
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

  // Update Validation
  server.registerTool(
    "update_validation",
    {
      description: "Update an existing validation rule",
      inputSchema: {
        id: z.string().describe("Validation ID"),
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
        mutation ValidationUpdate($id: ID!, $input: ValidationInput!) {
          validationUpdate(id: $id, input: $input) {
            validation {
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

  // Delete Validation
  server.registerTool(
    "delete_validation",
    {
      description: "Delete a validation rule",
      inputSchema: {
        id: z.string().describe("Validation ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation ValidationDelete($id: ID!) {
          validationDelete(id: $id) {
            deletedValidationId
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
