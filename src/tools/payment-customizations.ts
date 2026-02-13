import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPaymentCustomizationTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Payment Customizations
  server.registerTool(
    "get_payment_customizations",
    {
      description: "Fetch payment customizations from the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of payment customizations to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query for payment customizations"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, reverse = false }) => {
      const graphqlQuery = `
        query GetPaymentCustomizations($first: Int!, $after: String, $query: String, $reverse: Boolean) {
          paymentCustomizations(first: $first, after: $after, query: $query, reverse: $reverse) {
            edges {
              node {
                id
                title
                enabled
                functionId
                shopifyFunction {
                  id
                  title
                  apiType
                }
                metafields(first: 10) {
                  edges {
                    node {
                      id
                      namespace
                      key
                      value
                      type
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after, query, reverse });
        
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

  // Get Payment Customization
  server.registerTool(
    "get_payment_customization",
    {
      description: "Fetch a specific payment customization by ID",
      inputSchema: {
        id: z.string().describe("Payment Customization ID (e.g., 'gid://shopify/PaymentCustomization/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetPaymentCustomization($id: ID!) {
          paymentCustomization(id: $id) {
            id
            title
            enabled
            functionId
            shopifyFunction {
              id
              title
              apiType
              app {
                id
                title
              }
            }
            metafields(first: 50) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                  description
                }
              }
            }
            errorHistory {
              errorsFirstOccurredAt
              hasBeenSharedSinceLastError
              firstOccurredAt
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

  // Create Payment Customization
  server.registerTool(
    "create_payment_customization",
    {
      description: "Create a new payment customization",
      inputSchema: {
        title: z.string().describe("Title of the payment customization"),
        functionHandle: z.string().describe("Function handle scoped to your app ID"),
        enabled: z.boolean().optional().describe("Whether the customization is enabled (default: true)"),
        metafields: z.array(z.object({
          namespace: z.string().describe("Metafield namespace"),
          key: z.string().describe("Metafield key"),
          value: z.string().describe("Metafield value"),
          type: z.string().describe("Metafield type (e.g., 'json', 'string')"),
        })).optional().describe("Metafields to associate with the customization"),
      },
    },
    async ({ title, functionHandle, enabled = true, metafields }) => {
      const mutation = `
        mutation PaymentCustomizationCreate($paymentCustomization: PaymentCustomizationInput!) {
          paymentCustomizationCreate(paymentCustomization: $paymentCustomization) {
            paymentCustomization {
              id
              title
              enabled
              functionId
              shopifyFunction {
                id
                title
              }
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
              code
            }
          }
        }
      `;

      const input: Record<string, unknown> = { title, functionHandle, enabled };
      if (metafields) input.metafields = metafields;

      try {
        const result = await client.execute(mutation, { paymentCustomization: input });
        
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

  // Update Payment Customization
  server.registerTool(
    "update_payment_customization",
    {
      description: "Update an existing payment customization",
      inputSchema: {
        id: z.string().describe("Payment Customization ID"),
        title: z.string().optional().describe("New title for the customization"),
        enabled: z.boolean().optional().describe("Enable or disable the customization"),
        functionHandle: z.string().optional().describe("Function handle scoped to your app ID"),
        metafields: z.array(z.object({
          namespace: z.string().describe("Metafield namespace"),
          key: z.string().describe("Metafield key"),
          value: z.string().describe("Metafield value"),
          type: z.string().describe("Metafield type"),
        })).optional().describe("Metafields to update or create"),
      },
    },
    async ({ id, title, enabled, functionHandle, metafields }) => {
      const mutation = `
        mutation PaymentCustomizationUpdate($id: ID!, $paymentCustomization: PaymentCustomizationInput!) {
          paymentCustomizationUpdate(id: $id, paymentCustomization: $paymentCustomization) {
            paymentCustomization {
              id
              title
              enabled
              functionId
              shopifyFunction {
                id
                title
              }
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
              code
            }
          }
        }
      `;

      const input: Record<string, unknown> = {};
      if (title !== undefined) input.title = title;
      if (enabled !== undefined) input.enabled = enabled;
      if (functionHandle !== undefined) input.functionHandle = functionHandle;
      if (metafields !== undefined) input.metafields = metafields;

      try {
        const result = await client.execute(mutation, { id, paymentCustomization: input });
        
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

  // Delete Payment Customization
  server.registerTool(
    "delete_payment_customization",
    {
      description: "Delete a payment customization",
      inputSchema: {
        id: z.string().describe("Payment Customization ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation PaymentCustomizationDelete($id: ID!) {
          paymentCustomizationDelete(id: $id) {
            deletedId
            userErrors {
              field
              message
              code
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

  // Activate/Deactivate Payment Customizations
  server.registerTool(
    "set_payment_customization_activation",
    {
      description: "Activate or deactivate multiple payment customizations",
      inputSchema: {
        ids: z.array(z.string()).describe("Array of Payment Customization IDs"),
        enabled: z.boolean().describe("Set to true to activate, false to deactivate"),
      },
    },
    async ({ ids, enabled }) => {
      const mutation = `
        mutation PaymentCustomizationActivation($ids: [ID!]!, $enabled: Boolean!) {
          paymentCustomizationActivation(ids: $ids, enabled: $enabled) {
            ids
            userErrors {
              field
              message
              code
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { ids, enabled });
        
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
