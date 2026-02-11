import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerFulfillmentConstraintTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Fulfillment Constraint Rules
  server.registerTool(
    "get_fulfillment_constraint_rules",
    {
      description: "Fetch fulfillment constraint rules for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of rules to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetFulfillmentConstraints($first: Int!, $after: String) {
          fulfillmentConstraintRules(first: $first, after: $after) {
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

  // Create Fulfillment Constraint Rule
  server.registerTool(
    "create_fulfillment_constraint_rule",
    {
      description: "Create a new fulfillment constraint rule using a Shopify Function",
      inputSchema: {
        functionId: z.string().describe("ID of the fulfillment constraint function to use"),
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
        mutation FulfillmentConstraintRuleCreate($input: FulfillmentConstraintRuleInput!) {
          fulfillmentConstraintRuleCreate(input: $input) {
            fulfillmentConstraintRule {
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

  // Update Fulfillment Constraint Rule
  server.registerTool(
    "update_fulfillment_constraint_rule",
    {
      description: "Update an existing fulfillment constraint rule",
      inputSchema: {
        id: z.string().describe("Fulfillment Constraint Rule ID"),
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
        mutation FulfillmentConstraintRuleUpdate($id: ID!, $input: FulfillmentConstraintRuleInput!) {
          fulfillmentConstraintRuleUpdate(id: $id, input: $input) {
            fulfillmentConstraintRule {
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

  // Delete Fulfillment Constraint Rule
  server.registerTool(
    "delete_fulfillment_constraint_rule",
    {
      description: "Delete a fulfillment constraint rule",
      inputSchema: {
        id: z.string().describe("Fulfillment Constraint Rule ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation FulfillmentConstraintRuleDelete($id: ID!) {
          fulfillmentConstraintRuleDelete(id: $id) {
            deletedFulfillmentConstraintRuleId
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
