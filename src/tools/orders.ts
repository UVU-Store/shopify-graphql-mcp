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

  // Create Order
  server.registerTool(
    "create_order",
    {
      description: "Create a new order programmatically. Useful for importing orders from external systems or creating wholesale orders. Requires write_orders scope.",
      inputSchema: {
        lineItems: z.array(z.object({
          variantId: z.string().optional().describe("Product variant ID (e.g., 'gid://shopify/ProductVariant/123456789')"),
          title: z.string().optional().describe("Line item title (required if variantId not provided)"),
          price: z.number().optional().describe("Line item price (required if variantId not provided)"),
          quantity: z.number().min(1).describe("Quantity of the item"),
          sku: z.string().optional().describe("SKU for the line item"),
        })).describe("Line items for the order"),
        customerId: z.string().optional().describe("Existing customer ID to associate with order (e.g., 'gid://shopify/Customer/123456789')"),
        customerEmail: z.string().optional().describe("Customer email (to create or upsert customer)"),
        customerFirstName: z.string().optional().describe("Customer first name"),
        customerLastName: z.string().optional().describe("Customer last name"),
        email: z.string().optional().describe("Order email address"),
        shippingAddress: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          province: z.string().optional(),
          provinceCode: z.string().optional(),
          country: z.string().optional(),
          countryCode: z.string().optional(),
          zip: z.string(),
          phone: z.string().optional(),
        }).optional().describe("Shipping address"),
        billingAddress: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          province: z.string().optional(),
          provinceCode: z.string().optional(),
          country: z.string().optional(),
          countryCode: z.string().optional(),
          zip: z.string(),
          phone: z.string().optional(),
        }).optional().describe("Billing address (defaults to shipping if not provided)"),
        financialStatus: z.enum(["PENDING", "PAID", "PARTIALLY_PAID", "REFUNDED", "PARTIALLY_REFUNDED", "VOIDED"]).optional().describe("Financial status of the order"),
        fulfillmentStatus: z.enum(["FULFILLED", "PARTIAL", "RESTOCKED"]).optional().describe("Fulfillment status"),
        currency: z.string().optional().describe("Currency code (e.g., 'USD', 'EUR')"),
        discountCode: z.string().optional().describe("Discount code to apply"),
        note: z.string().optional().describe("Order note"),
        tags: z.array(z.string()).optional().describe("Order tags"),
        sendReceipt: z.boolean().optional().describe("Send order receipt email to customer"),
        sendFulfillmentReceipt: z.boolean().optional().describe("Send fulfillment receipt email"),
      },
    },
    async ({ lineItems, customerId, customerEmail, customerFirstName, customerLastName, email, shippingAddress, billingAddress, financialStatus, fulfillmentStatus, currency, discountCode, note, tags, sendReceipt = false, sendFulfillmentReceipt = false }) => {
      const mutation = `
        mutation OrderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
          orderCreate(order: $order, options: $options) {
            order {
              id
              name
              email
              displayFinancialStatus
              displayFulfillmentStatus
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
                    originalUnitPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                    variant {
                      id
                    }
                  }
                }
              }
              customer {
                id
                firstName
                lastName
                email
              }
              shippingAddress {
                address1
                city
                province
                country
                zip
              }
              discountCodes
              tags
              note
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      // Build order input
      const orderInput: Record<string, unknown> = {
        lineItems: lineItems.map(item => {
          if (item.variantId) {
            return {
              variantId: item.variantId,
              quantity: item.quantity,
            };
          } else {
            return {
              title: item.title,
              quantity: item.quantity,
              priceSet: {
                shopMoney: {
                  amount: item.price?.toString() || "0",
                  currencyCode: currency || "USD",
                },
              },
            };
          }
        }),
      };

      // Add customer information
      if (customerId) {
        orderInput.customer = {
          id: customerId,
        };
      } else if (customerEmail) {
        orderInput.customer = {
          email: customerEmail,
          firstName: customerFirstName,
          lastName: customerLastName,
        };
      }

      // Add optional fields
      if (email) orderInput.email = email;
      if (currency) orderInput.currency = currency;
      if (financialStatus) orderInput.financialStatus = financialStatus;
      if (fulfillmentStatus) orderInput.fulfillmentStatus = fulfillmentStatus;
      if (shippingAddress) orderInput.shippingAddress = shippingAddress;
      if (billingAddress) orderInput.billingAddress = billingAddress;
      if (discountCode) orderInput.discountCode = discountCode;
      if (note) orderInput.note = note;
      if (tags) orderInput.tags = tags;

      const options = {
        sendReceipt,
        sendFulfillmentReceipt,
      };

      try {
        const result = await client.execute(mutation, { order: orderInput, options });

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

  // Update Order
  server.registerTool(
    "update_order",
    {
      description: "Update order attributes like email, shipping address, tags, and notes. For line item changes, use order editing instead.",
      inputSchema: {
        id: z.string().describe("Order ID (e.g., 'gid://shopify/Order/123456789')"),
        email: z.string().optional().describe("Customer email address"),
        note: z.string().optional().describe("Order note"),
        tags: z.array(z.string()).optional().describe("Order tags"),
        shippingAddress: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          province: z.string().optional(),
          provinceCode: z.string().optional(),
          country: z.string().optional(),
          countryCode: z.string().optional(),
          zip: z.string(),
          phone: z.string().optional(),
        }).optional().describe("Shipping address"),
      },
    },
    async ({ id, email, note, tags, shippingAddress }) => {
      const mutation = `
        mutation OrderUpdate($input: OrderInput!) {
          orderUpdate(input: $input) {
            order {
              id
              name
              email
              note
              tags
              shippingAddress {
                address1
                city
                province
                country
                zip
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { id };
      if (email !== undefined) input.email = email;
      if (note !== undefined) input.note = note;
      if (tags !== undefined) input.tags = tags;
      if (shippingAddress !== undefined) input.shippingAddress = shippingAddress;

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

  // Open Order
  server.registerTool(
    "open_order",
    {
      description: "Reopen a closed order",
      inputSchema: {
        id: z.string().describe("Order ID to reopen"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation OrderOpen($input: OrderOpenInput!) {
          orderOpen(input: $input) {
            order {
              id
              name
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

  // Close Order
  server.registerTool(
    "close_order",
    {
      description: "Close an open order. A closed order indicates no further work is required.",
      inputSchema: {
        id: z.string().describe("Order ID to close"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation OrderClose($input: OrderCloseInput!) {
          orderClose(input: $input) {
            order {
              id
              name
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

  // Delete Order
  server.registerTool(
    "delete_order",
    {
      description: "Permanently delete an order. Only certain order types can be deleted. This action is irreversible.",
      inputSchema: {
        id: z.string().describe("Order ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation OrderDelete($orderId: ID!) {
          orderDelete(orderId: $orderId) {
            deletedId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { orderId: id });

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

  // Capture Payment
  server.registerTool(
    "capture_order_payment",
    {
      description: "Capture payment for an authorized transaction. Use this to claim money that was previously reserved by an authorization.",
      inputSchema: {
        orderId: z.string().describe("Order ID"),
        parentTransactionId: z.string().describe("Parent transaction ID (authorization transaction)"),
        amount: z.string().describe("Amount to capture"),
        currency: z.string().optional().describe("Currency code for multi-currency orders"),
        finalCapture: z.boolean().optional().describe("Whether this is the final capture (closes authorization)"),
      },
    },
    async ({ orderId, parentTransactionId, amount, currency, finalCapture }) => {
      const mutation = `
        mutation OrderCapture($input: OrderCaptureInput!) {
          orderCapture(input: $input) {
            transaction {
              id
              kind
              status
              amountSet {
                presentmentMoney {
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

      const input: Record<string, unknown> = {
        id: orderId,
        parentTransactionId,
        amount,
      };
      if (currency) input.currency = currency;
      if (finalCapture !== undefined) input.finalCapture = finalCapture;

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

  // Mark Order as Paid
  server.registerTool(
    "mark_order_as_paid",
    {
      description: "Mark an order as paid by recording a payment transaction for the outstanding amount. Useful for manual payment methods.",
      inputSchema: {
        id: z.string().describe("Order ID to mark as paid"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation OrderMarkAsPaid($input: OrderMarkAsPaidInput!) {
          orderMarkAsPaid(input: $input) {
            order {
              id
              name
              displayFinancialStatus
            }
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
