import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPaymentTermsTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Payment Terms
  server.registerTool(
    "get_payment_terms",
    {
      description: "Fetch payment terms configurations",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of payment terms to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetPaymentTerms($first: Int!, $after: String) {
          paymentTerms(first: $first, after: $after) {
            edges {
              node {
                id
                name
                paymentTermsType
                dueInDays
                discountPercentage
                installments(first: 10) {
                  edges {
                    node {
                      id
                      dueInDays
                      percentage
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

  // Create Payment Terms
  server.registerTool(
    "create_payment_terms",
    {
      description: "Create new payment terms",
      inputSchema: {
        name: z.string().describe("Payment terms name"),
        paymentTermsType: z.enum(["NET_30", "NET_60", "NET_90", "DUE_ON_RECEIPT", "FIXED", "INSTALLMENT"]).describe("Type of payment terms"),
        dueInDays: z.number().optional().describe("Number of days until due (for NET types)"),
        discountPercentage: z.number().optional().describe("Discount percentage for early payment"),
      },
    },
    async ({ name, paymentTermsType, dueInDays, discountPercentage }) => {
      const mutation = `
        mutation PaymentTermsCreate($input: PaymentTermsInput!) {
          paymentTermsCreate(input: $input) {
            paymentTerms {
              id
              name
              paymentTermsType
              dueInDays
              discountPercentage
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { name, paymentTermsType };
      if (dueInDays) input.dueInDays = dueInDays;
      if (discountPercentage) input.discountPercentage = discountPercentage;

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

  // Update Payment Terms
  server.registerTool(
    "update_payment_terms",
    {
      description: "Update existing payment terms",
      inputSchema: {
        id: z.string().describe("Payment Terms ID"),
        name: z.string().optional().describe("Payment terms name"),
        dueInDays: z.number().optional().describe("Number of days until due"),
        discountPercentage: z.number().optional().describe("Discount percentage"),
      },
    },
    async ({ id, name, dueInDays, discountPercentage }) => {
      const mutation = `
        mutation PaymentTermsUpdate($id: ID!, $input: PaymentTermsInput!) {
          paymentTermsUpdate(id: $id, input: $input) {
            paymentTerms {
              id
              name
              paymentTermsType
              dueInDays
              discountPercentage
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = {};
      if (name) input.name = name;
      if (dueInDays !== undefined) input.dueInDays = dueInDays;
      if (discountPercentage !== undefined) input.discountPercentage = discountPercentage;

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

  // Delete Payment Terms
  server.registerTool(
    "delete_payment_terms",
    {
      description: "Delete payment terms",
      inputSchema: {
        id: z.string().describe("Payment Terms ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation PaymentTermsDelete($id: ID!) {
          paymentTermsDelete(id: $id) {
            deletedPaymentTermsId
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

  // Get Payment Mandates
  server.registerTool(
    "get_payment_mandates",
    {
      description: "Fetch payment mandates for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of mandates to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        paymentMethodType: z.string().optional().describe("Filter by payment method type"),
      },
    },
    async ({ first = 50, after, paymentMethodType }) => {
      const query = `
        query GetPaymentMandates($first: Int!, $after: String, $paymentMethodType: String) {
          paymentMandates(first: $first, after: $after, paymentMethodType: $paymentMethodType) {
            edges {
              node {
                id
                paymentMethod {
                  ... on SepaMandate {
                    reference
                    creditorId
                    maskedIban
                  }
                }
                status
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
        const result = await client.execute(query, { first, after, paymentMethodType });
        
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
