import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerOrderEditTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Order Edit
  server.registerTool(
    "get_order_edit",
    {
      description: "Fetch an order edit by ID",
      inputSchema: {
        id: z.string().describe("Order Edit ID (e.g., 'gid://shopify/OrderEdit/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetOrderEdit($id: ID!) {
          orderEdit(id: $id) {
            id
            createdAt
            updatedAt
            resourceId
            resourceUrl
            additions(first: 50) {
              edges {
                node {
                  id
                  productVariantId
                  quantity
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
            removals(first: 50) {
              edges {
                node {
                  id
                  lineItemId
                  quantity
                }
              }
            }
            edits(first: 50) {
              edges {
                node {
                  id
                  lineItemId
                  quantity
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
            adjustments(first: 50) {
              edges {
                node {
                  id
                  value {
                    amount
                    currencyCode
                  }
                  reason
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, { id });
        
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

  // Calculate Order Edit
  server.registerTool(
    "calculate_order_edit",
    {
      description: "Calculate changes for an order edit without applying them",
      inputSchema: {
        orderId: z.string().describe("Order ID to edit"),
        additions: z.array(z.object({
          productVariantId: z.string().describe("Product variant ID"),
          quantity: z.number().min(1).describe("Quantity to add"),
        })).optional().describe("Items to add"),
        removals: z.array(z.object({
          lineItemId: z.string().describe("Line item ID to remove"),
          quantity: z.number().min(1).describe("Quantity to remove"),
        })).optional().describe("Items to remove"),
        edits: z.array(z.object({
          lineItemId: z.string().describe("Line item ID to edit"),
          quantity: z.number().optional().describe("New quantity"),
          price: z.string().optional().describe("New price"),
        })).optional().describe("Items to edit"),
      },
    },
    async ({ orderId, additions, removals, edits }) => {
      const mutation = `
        mutation OrderEditCalculate($id: ID!, $input: OrderEditInput!) {
          orderEditCalculate(id: $id, input: $input) {
            calculatedOrder {
              id
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              subtotalPriceSet {
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
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
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
      if (additions && additions.length > 0) input.additions = additions;
      if (removals && removals.length > 0) input.removals = removals;
      if (edits && edits.length > 0) input.edits = edits;

      try {
        const result = await client.execute(mutation, { id: orderId, input });
        
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

  // Apply Order Edit
  server.registerTool(
    "apply_order_edit",
    {
      description: "Apply an order edit to the order",
      inputSchema: {
        orderId: z.string().describe("Order ID to edit"),
        additions: z.array(z.object({
          productVariantId: z.string().describe("Product variant ID"),
          quantity: z.number().min(1).describe("Quantity to add"),
        })).optional().describe("Items to add"),
        removals: z.array(z.object({
          lineItemId: z.string().describe("Line item ID to remove"),
          quantity: z.number().min(1).describe("Quantity to remove"),
        })).optional().describe("Items to remove"),
        edits: z.array(z.object({
          lineItemId: z.string().describe("Line item ID to edit"),
          quantity: z.number().optional().describe("New quantity"),
          price: z.string().optional().describe("New price"),
        })).optional().describe("Items to edit"),
        note: z.string().optional().describe("Note about the edit"),
      },
    },
    async ({ orderId, additions, removals, edits, note }) => {
      const mutation = `
        mutation OrderEditApply($id: ID!, $input: OrderEditInput!) {
          orderEditApply(id: $id, input: $input) {
            order {
              id
              totalPriceSet {
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
      if (additions && additions.length > 0) input.additions = additions;
      if (removals && removals.length > 0) input.removals = removals;
      if (edits && edits.length > 0) input.edits = edits;
      if (note) input.note = note;

      try {
        const result = await client.execute(mutation, { id: orderId, input });
        
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

  // Add Line Items to Order
  server.registerTool(
    "add_line_items_to_order",
    {
      description: "Add line items to an order",
      inputSchema: {
        orderId: z.string().describe("Order ID"),
        lineItems: z.array(z.object({
          productVariantId: z.string().describe("Product variant ID"),
          quantity: z.number().min(1).describe("Quantity"),
          price: z.string().optional().describe("Custom price (optional)"),
        })).min(1).describe("Line items to add"),
      },
    },
    async ({ orderId, lineItems }) => {
      const mutation = `
        mutation OrderEditAddLineItems($id: ID!, $input: OrderEditAddLineItemsInput!) {
          orderEditAddLineItems(id: $id, input: $input) {
            addedLineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
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

      const input = { lineItems };

      try {
        const result = await client.execute(mutation, { id: orderId, input });
        
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

  // Remove Line Items from Order
  server.registerTool(
    "remove_line_items_from_order",
    {
      description: "Remove line items from an order",
      inputSchema: {
        orderId: z.string().describe("Order ID"),
        lineItems: z.array(z.object({
          lineItemId: z.string().describe("Line item ID"),
          quantity: z.number().min(1).describe("Quantity to remove"),
        })).min(1).describe("Line items to remove"),
      },
    },
    async ({ orderId, lineItems }) => {
      const mutation = `
        mutation OrderEditRemoveLineItems($id: ID!, $input: OrderEditRemoveLineItemsInput!) {
          orderEditRemoveLineItems(id: $id, input: $input) {
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = { lineItems };

      try {
        const result = await client.execute(mutation, { id: orderId, input });
        
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
