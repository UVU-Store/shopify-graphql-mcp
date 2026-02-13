import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerReturnsTools(server: McpServer, client: ShopifyGraphQLClient) {
  server.registerTool(
    "get_returnable_fulfillments",
    {
      description: "Fetch fulfillments that can be returned for an order",
      inputSchema: {
        orderId: z.string().describe("Order ID (e.g., 'gid://shopify/Order/123456789')"),
        first: z.number().min(1).max(250).optional().describe("Number of fulfillments to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ orderId, first = 50, after }) => {
      const graphqlQuery = `
        query GetReturnableFulfillments($orderId: ID!, $first: Int!, $after: String) {
          returnableFulfillments(orderId: $orderId, first: $first, after: $after) {
            edges {
              node {
                id
                returnType
                fulfillment {
                  id
                  status
                  createdAt
                  trackingInfo(first: 5) {
                    edges {
                      node {
                        number
                        company
                        url
                      }
                    }
                  }
                  lineItems(first: 10) {
                    edges {
                      node {
                        id
                        title
                        quantity
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
        const result = await client.execute(graphqlQuery, { orderId, first, after });
        
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
    "get_returns_by_order",
    {
      description: "Fetch returns for a specific order",
      inputSchema: {
        orderId: z.string().describe("Order ID (e.g., 'gid://shopify/Order/123456789')"),
      },
    },
    async ({ orderId }) => {
      const graphqlQuery = `
        query GetOrderReturns($id: ID!) {
          order(id: $id) {
            id
            name
            returns(first: 20) {
              edges {
                node {
                  id
                  name
                  createdAt
                  status
                  returnLineItems(first: 20) {
                    edges {
                      node {
                        id
                        quantity
                        fulfillmentLineItem {
                          id
                          title
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id: orderId });
        
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
    "get_return",
    {
      description: "Fetch a specific return by ID",
      inputSchema: {
        id: z.string().describe("Return ID (e.g., 'gid://shopify/Return/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetReturn($id: ID!) {
          return(id: $id) {
            id
            name
            createdAt
            updatedAt
            closedAt
            status
            order {
              id
              name
              customer {
                id
                firstName
                lastName
                email
              }
            }
            returnLineItems(first: 50) {
              edges {
                node {
                  id
                  quantity
                  processedQuantity
                  refundableQuantity
                  returnReasonNote
                  fulfillmentLineItem {
                    id
                    title
                    quantity
                    variant {
                      id
                      title
                      sku
                    }
                  }
                }
              }
            }
            reverseFulfillmentOrders(first: 10) {
              edges {
                node {
                  id
                  status
                  fulfillmentHolds
                }
              }
            }
            refunds(first: 10) {
              edges {
                node {
                  id
                  createdAt
                  totalRefundedSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                }
              }
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
    "create_return",
    {
      description: "Create a new return from an order",
      inputSchema: {
        orderId: z.string().describe("Order ID (e.g., 'gid://shopify/Order/123456789')"),
        returnLineItems: z.array(z.object({
          fulfillmentLineItemId: z.string().describe("Fulfillment line item ID"),
          quantity: z.number().describe("Quantity to return"),
          reason: z.enum(["UNKNOWN", "REQUESTED_BY_CUSTOMER", "NOT_AS_DESCRIBED", "DEFECTIVE", "DELIVERED_LATE", "NOT_DELIVERED", "RETURNED", "EXCHANGE", "OTHER"]).optional().describe("Return reason"),
          note: z.string().optional().describe("Return note"),
        })).describe("Return line items"),
        returnShippingFee: z.number().optional().describe("Return shipping fee amount"),
      },
    },
    async ({ orderId, returnLineItems, returnShippingFee }) => {
      const graphqlQuery = `
        mutation CreateReturn($input: ReturnInput!) {
          returnCreate(returnInput: $input) {
            return {
              id
              name
              createdAt
              status
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
        const formattedLineItems = returnLineItems.map(item => ({
          fulfillmentLineItemId: item.fulfillmentLineItemId,
          quantity: item.quantity,
          ...(item.reason && { reason: item.reason }),
          ...(item.note && { customerNote: item.note }),
        }));

        const input: Record<string, unknown> = {
          orderId,
          returnLineItems: formattedLineItems,
        };

        if (returnShippingFee !== undefined) {
          input.returnShippingFee = {
            amount: returnShippingFee.toString(),
            taxAmount: "0",
          };
        }

        const result = await client.execute(graphqlQuery, { input });
        
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
    "approve_return_request",
    {
      description: "Approve a return request",
      inputSchema: {
        returnId: z.string().describe("Return ID (e.g., 'gid://shopify/Return/123456789')"),
      },
    },
    async ({ returnId }) => {
      const graphqlQuery = `
        mutation ApproveReturnRequest($input: ReturnApproveRequestInput!) {
          returnApproveRequest(input: $input) {
            return {
              id
              name
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { input: { returnId } });
        
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
    "decline_return_request",
    {
      description: "Decline a return request",
      inputSchema: {
        returnId: z.string().describe("Return ID (e.g., 'gid://shopify/Return/123456789')"),
        reason: z.enum(["OUT_OF_POLICY", "ITEM_NOT_RECEIVED", "REFUND_NOT_APPROVED", "OTHER"]).describe("Reason for declining"),
        note: z.string().optional().describe("Note explaining why return was declined"),
      },
    },
    async ({ returnId, reason, note }) => {
      const graphqlQuery = `
        mutation DeclineReturnRequest($input: ReturnDeclineRequestInput!) {
          returnDeclineRequest(input: $input) {
            return {
              id
              name
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const input: Record<string, unknown> = { returnId, reason };
        if (note) {
          input.note = note;
        }

        const result = await client.execute(graphqlQuery, { input });
        
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
    "close_return",
    {
      description: "Close a return",
      inputSchema: {
        returnId: z.string().describe("Return ID (e.g., 'gid://shopify/Return/123456789')"),
      },
    },
    async ({ returnId }) => {
      const graphqlQuery = `
        mutation CloseReturn($id: ID!) {
          returnClose(id: $id) {
            return {
              id
              name
              status
              closedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id: returnId });
        
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
