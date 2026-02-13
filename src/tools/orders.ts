import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";
import { Order } from "../types/index.js";

export function registerOrderTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Orders
  server.registerTool(
    "get_orders",
    {
      description: "Fetch orders from the Shopify store with optional filtering",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of orders to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'status:open', 'created_at:>2024-01-01')"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "PROCESSED_AT", "TOTAL_PRICE", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetOrders($first: Int!, $after: String, $query: String, $sortKey: OrderSortKeys, $reverse: Boolean) {
          orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                name
                createdAt
                updatedAt
                displayFinancialStatus
                displayFulfillmentStatus
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
                customer {
                  id
                  firstName
                  lastName
                  email
                }
                lineItems(first: 10) {
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
        const result = await client.execute<{ orders: { edges: Array<{ node: Order; cursor: string }>; pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean } } }>(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Get Single Order
  server.registerTool(
    "get_order",
    {
      description: "Fetch a specific order by ID",
      inputSchema: {
        id: z.string().describe("Order ID (e.g., 'gid://shopify/Order/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetOrder($id: ID!) {
          order(id: $id) {
            id
            name
            createdAt
            updatedAt
            displayFinancialStatus
            displayFulfillmentStatus
            email
            phone
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
            totalShippingPriceSet {
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
            customer {
              id
              firstName
              lastName
              email
              phone
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
        const result = await client.execute<{ order: Order }>(graphqlQuery, { id });
        
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

  // Get All Orders (read_all_orders scope - more comprehensive data)
  server.registerTool(
    "get_all_orders",
    {
      description: "Fetch all orders with comprehensive data including archived and cancelled orders",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of orders to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'status:any', 'created_at:>2024-01-01')"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "PROCESSED_AT", "TOTAL_PRICE", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetAllOrders($first: Int!, $after: String, $query: String, $sortKey: OrderSortKeys, $reverse: Boolean) {
          orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                name
                createdAt
                updatedAt
                processedAt
                cancelledAt
                closedAt
                displayFinancialStatus
                displayFulfillmentStatus
                status
                confirmed
                confirmationNumber
                paymentGatewayNames
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
                totalDiscountsSet {
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
                totalShippingPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                customer {
                  id
                  firstName
                  lastName
                  email
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
                      discountedUnitPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
                      }
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
                  city
                  province
                  country
                  zip
                }
                billingAddress {
                  address1
                  city
                  province
                  country
                  zip
                }
                fulfillments(first: 10) {
                  edges {
                    node {
                      id
                      status
                      createdAt
                      trackingInfo {
                        number
                        company
                      }
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
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Cancel Order
  server.registerTool(
    "cancel_order",
    {
      description: "Cancel an order",
      inputSchema: {
        id: z.string().describe("Order ID (e.g., 'gid://shopify/Order/123456789')"),
        reason: z.string().optional().describe("Cancellation reason"),
        refund: z.boolean().optional().describe("Whether to refund the order"),
        restock: z.boolean().optional().describe("Whether to restock inventory"),
      },
    },
    async ({ id, reason, refund = true, restock = true }) => {
      const mutation = `
        mutation OrderCancel($orderId: ID!, $reason: String, $refund: Boolean, $restock: Boolean) {
          orderCancel(
            orderId: $orderId
            reason: $reason
            refund: $refund
            restock: $restock
          ) {
            order {
              id
              name
              displayFinancialStatus
              displayFulfillmentStatus
              cancelledAt
              cancelReason
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { orderId: id, reason, refund, restock });

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
