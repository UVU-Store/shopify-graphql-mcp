import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerDraftOrderTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Draft Orders
  server.registerTool(
    "get_draft_orders",
    {
      description: "Fetch draft orders from the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of draft orders to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, reverse = true }) => {
      const graphqlQuery = `
        query GetDraftOrders($first: Int!, $after: String, $query: String, $reverse: Boolean) {
          draftOrders(first: $first, after: $after, query: $query, reverse: $reverse) {
            edges {
              node {
                id
                name
                email
                phone
                createdAt
                updatedAt
                completedAt
                status
                subtotalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      originalUnitPrice
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

  // Get Single Draft Order
  server.registerTool(
    "get_draft_order",
    {
      description: "Fetch a specific draft order by ID",
      inputSchema: {
        id: z.string().describe("Draft Order ID (e.g., 'gid://shopify/DraftOrder/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetDraftOrder($id: ID!) {
          draftOrder(id: $id) {
            id
            name
            email
            phone
            note
            createdAt
            updatedAt
            completedAt
            status
            subtotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalTaxSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPrice
                  variant {
                    id
                    title
                    sku
                    product {
                      id
                      title
                    }
                  }
                }
              }
            }
            shippingAddress {
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            billingAddress {
              address1
              address2
              city
              province
              country
              zip
              phone
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

  // Create Draft Order
  server.registerTool(
    "create_draft_order",
    {
      description: "Create a new draft order",
      inputSchema: {
        email: z.string().email().optional().describe("Customer email"),
        phone: z.string().optional().describe("Customer phone"),
        lineItems: z.array(z.object({
          variantId: z.string().describe("Product variant ID"),
          quantity: z.number().min(1).describe("Quantity"),
        })).min(1).describe("Line items for the draft order"),
        note: z.string().optional().describe("Draft order note"),
        tags: z.array(z.string()).optional().describe("Draft order tags"),
      },
    },
    async ({ email, phone, lineItems, note, tags }) => {
      const mutation = `
        mutation DraftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              name
              email
              phone
              createdAt
              updatedAt
              status
              subtotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
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

      const input: Record<string, unknown> = { lineItems };
      if (email) input.email = email;
      if (phone) input.phone = phone;
      if (note) input.note = note;
      if (tags) input.tags = tags;

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

  // Complete Draft Order
  server.registerTool(
    "complete_draft_order",
    {
      description: "Complete a draft order and convert it to an order",
      inputSchema: {
        id: z.string().describe("Draft Order ID"),
        paymentPending: z.boolean().optional().describe("Mark as payment pending"),
      },
    },
    async ({ id, paymentPending = false }) => {
      const mutation = `
        mutation DraftOrderComplete($id: ID!, $paymentPending: Boolean) {
          draftOrderComplete(id: $id, paymentPending: $paymentPending) {
            draftOrder {
              id
              name
              status
              completedAt
              order {
                id
                name
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
        const result = await client.execute(mutation, { id, paymentPending });
        
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

  // Delete Draft Order
  server.registerTool(
    "delete_draft_order",
    {
      description: "Delete a draft order",
      inputSchema: {
        id: z.string().describe("Draft Order ID"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation DraftOrderDelete($input: DraftOrderDeleteInput!) {
          draftOrderDelete(input: $input) {
            deletedDraftOrderId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { input: { id } });
        
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
