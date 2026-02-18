import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerFulfillmentTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Assigned Fulfillment Orders
  server.registerTool(
    "get_assigned_fulfillment_orders",
    {
      description: "Fetch fulfillment orders assigned to a fulfillment service",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of fulfillment orders to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        assignmentStatus: z.enum(["FULFILLMENT_REQUESTED", "CANCELLATION_REQUESTED", "ACCEPTED", "FULFILLED", "CLOSED"]).optional().describe("Filter by assignment status"),
        locationIds: z.array(z.string()).optional().describe("Filter by location IDs"),
      },
    },
    async ({ first = 50, after, assignmentStatus, locationIds }) => {
      const query = `
        query GetAssignedFulfillmentOrders($first: Int!, $after: String, $assignmentStatus: FulfillmentOrderAssignmentStatus, $locationIds: [ID!]) {
          assignedFulfillmentOrders(first: $first, after: $after, assignmentStatus: $assignmentStatus, locationIds: $locationIds) {
            edges {
              node {
                id
                status
                assignedLocation {
                  id
                  name
                  address {
                    address1
                    city
                    province
                    country
                    zip
                  }
                }
                destination {
                  id
                  address1
                  city
                  province
                  country
                  zip
                }
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      remainingQuantity
                      lineItem {
                        id
                        title
                        quantity
                      }
                    }
                  }
                }
                order {
                  id
                  name
                  createdAt
                }
                requestStatus
                fulfillmentHolds {
                  reason
                  reasonNotes
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
        const result = await client.execute(query, { first, after, assignmentStatus, locationIds });
        
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

  // Get Fulfillment Order
  server.registerTool(
    "get_fulfillment_order",
    {
      description: "Fetch a specific fulfillment order by ID",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID (e.g., 'gid://shopify/FulfillmentOrder/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetFulfillmentOrder($id: ID!) {
          fulfillmentOrder(id: $id) {
            id
            status
            requestStatus
            assignedLocation {
              id
              name
              address {
                address1
                city
                province
                country
                zip
              }
            }
            destination {
              id
              address1
              city
              province
              country
              zip
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  remainingQuantity
                  lineItem {
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
            order {
              id
              name
              createdAt
              customer {
                id
                firstName
                lastName
                email
              }
            }
            merchantRequests(first: 10) {
              edges {
                node {
                  id
                  kind
                  message
                  requestOptions {
                    label
                    code
                  }
                }
              }
            }
            fulfillmentHolds {
              reason
              reasonNotes
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

  // Accept Fulfillment Request
  server.registerTool(
    "accept_fulfillment_request",
    {
      description: "Accept a fulfillment request for a fulfillment order",
      inputSchema: {
        fulfillmentOrderId: z.string().describe("Fulfillment Order ID"),
        message: z.string().optional().describe("Optional message"),
      },
    },
    async ({ fulfillmentOrderId, message }) => {
      const mutation = `
        mutation FulfillmentOrderAcceptFulfillmentRequest($id: ID!, $message: String) {
          fulfillmentOrderAcceptFulfillmentRequest(id: $id, message: $message) {
            fulfillmentOrder {
              id
              status
              requestStatus
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { id: fulfillmentOrderId, message });
        
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

  // Reject Fulfillment Request
  server.registerTool(
    "reject_fulfillment_request",
    {
      description: "Reject a fulfillment request for a fulfillment order",
      inputSchema: {
        fulfillmentOrderId: z.string().describe("Fulfillment Order ID"),
        message: z.string().optional().describe("Reason for rejection"),
      },
    },
    async ({ fulfillmentOrderId, message }) => {
      const mutation = `
        mutation FulfillmentOrderRejectFulfillmentRequest($id: ID!, $message: String) {
          fulfillmentOrderRejectFulfillmentRequest(id: $id, message: $message) {
            fulfillmentOrder {
              id
              status
              requestStatus
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { id: fulfillmentOrderId, message });
        
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

  // Get Custom Fulfillment Services
  server.registerTool(
    "get_fulfillment_services",
    {
      description: "Fetch custom fulfillment services configured in the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of fulfillment services to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetFulfillmentServices($first: Int!, $after: String) {
          fulfillmentServices(first: $first, after: $after) {
            edges {
              node {
                id
                handle
                name
                email
                serviceName
                location {
                  id
                  name
                  address {
                    address1
                    city
                    province
                    country
                    zip
                  }
                }
                productBased
                inventoryManagement
                trackingSupport
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

  // Create Fulfillment
  server.registerTool(
    "create_fulfillment",
    {
      description: "Create a fulfillment for a fulfillment order",
      inputSchema: {
        fulfillmentOrderId: z.string().describe("Fulfillment Order ID"),
        trackingInfo: z.object({
          number: z.string().optional().describe("Tracking number"),
          url: z.string().optional().describe("Tracking URL"),
          company: z.string().optional().describe("Shipping carrier company"),
        }).optional().describe("Tracking information"),
        notifyCustomer: z.boolean().optional().describe("Notify customer of shipment"),
        lineItems: z.array(z.object({
          id: z.string().describe("Fulfillment order line item ID"),
          quantity: z.number().min(1).describe("Quantity to fulfill"),
        })).optional().describe("Specific line items to fulfill (optional - fulfills all if not provided)"),
      },
    },
    async ({ fulfillmentOrderId, trackingInfo, notifyCustomer = true, lineItems }) => {
      const mutation = `
        mutation FulfillmentCreateV2($fulfillmentOrderId: ID!, $trackingInfo: FulfillmentTrackingInput, $notifyCustomer: Boolean, $lineItemsByFulfillmentOrder: [FulfillmentOrderLineItemsInput!]) {
          fulfillmentCreateV2(
            fulfillmentOrderId: $fulfillmentOrderId
            trackingInfo: $trackingInfo
            notifyCustomer: $notifyCustomer
            lineItemsByFulfillmentOrder: $lineItemsByFulfillmentOrder
          ) {
            fulfillment {
              id
              status
              trackingInfo {
                number
                url
                company
              }
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables: Record<string, unknown> = {
        fulfillmentOrderId,
        trackingInfo,
        notifyCustomer,
      };

      if (lineItems && lineItems.length > 0) {
        variables.lineItemsByFulfillmentOrder = lineItems;
      }

      try {
        const result = await client.execute(mutation, variables);
        
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

  // Hold Fulfillment Order
  server.registerTool(
    "hold_fulfillment_order",
    {
      description: "Apply a fulfillment hold on a fulfillment order. Use this to pause fulfillment due to inventory issues, customer requests, or other reasons.",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID"),
        reason: z.enum(["INVENTORY_OUT_OF_STOCK", "CUSTOMER_REQUEST", "FRAUD_RISK", "SHIPPING_DELAY", "OTHER"]).describe("Reason for the hold"),
        reasonNotes: z.string().optional().describe("Additional notes about the hold"),
        notifyMerchant: z.boolean().optional().describe("Notify the merchant about the hold"),
      },
    },
    async ({ id, reason, reasonNotes, notifyMerchant }) => {
      const mutation = `
        mutation FulfillmentOrderHold($id: ID!, $fulfillmentHold: FulfillmentOrderHoldInput!) {
          fulfillmentOrderHold(id: $id, fulfillmentHold: $fulfillmentHold) {
            fulfillmentOrder {
              id
              status
              requestStatus
              fulfillmentHolds {
                reason
                reasonNotes
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const fulfillmentHold: Record<string, unknown> = { reason };
      if (reasonNotes) fulfillmentHold.reasonNotes = reasonNotes;
      if (notifyMerchant !== undefined) fulfillmentHold.notifyMerchant = notifyMerchant;

      try {
        const result = await client.execute(mutation, { id, fulfillmentHold });

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

  // Release Fulfillment Hold
  server.registerTool(
    "release_fulfillment_hold",
    {
      description: "Release the fulfillment hold on a fulfillment order, allowing it to be fulfilled.",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID"),
        holdIds: z.array(z.string()).optional().describe("Specific hold IDs to release (releases all if not provided)"),
      },
    },
    async ({ id, holdIds }) => {
      const mutation = `
        mutation FulfillmentOrderReleaseHold($id: ID!, $holdIds: [ID!]) {
          fulfillmentOrderReleaseHold(id: $id, holdIds: $holdIds) {
            fulfillmentOrder {
              id
              status
              requestStatus
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { id, holdIds });

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

  // Move Fulfillment Order
  server.registerTool(
    "move_fulfillment_order",
    {
      description: "Move a fulfillment order to a different location for fulfillment.",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID"),
        newLocationId: z.string().describe("ID of the new location"),
      },
    },
    async ({ id, newLocationId }) => {
      const mutation = `
        mutation FulfillmentOrderMove($id: ID!, $newLocationId: ID!) {
          fulfillmentOrderMove(id: $id, newLocationId: $newLocationId) {
            movedFulfillmentOrder {
              id
              status
              assignedLocation {
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
        const result = await client.execute(mutation, { id, newLocationId });

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

  // Open Fulfillment Order
  server.registerTool(
    "open_fulfillment_order",
    {
      description: "Mark a fulfillment order as open, ready for fulfillment.",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation FulfillmentOrderOpen($id: ID!) {
          fulfillmentOrderOpen(id: $id) {
            fulfillmentOrder {
              id
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

  // Close Fulfillment Order
  server.registerTool(
    "close_fulfillment_order",
    {
      description: "Close a fulfillment order as incomplete, indicating the fulfillment service cannot ship remaining items.",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID"),
        message: z.string().optional().describe("Optional message explaining why the order is being closed"),
      },
    },
    async ({ id, message }) => {
      const mutation = `
        mutation FulfillmentOrderClose($id: ID!, $message: String) {
          fulfillmentOrderClose(id: $id, message: $message) {
            fulfillmentOrder {
              id
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
        const result = await client.execute(mutation, { id, message });

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

  // Cancel Fulfillment Order
  server.registerTool(
    "cancel_fulfillment_order",
    {
      description: "Cancel a fulfillment order.",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation FulfillmentOrderCancel($id: ID!) {
          fulfillmentOrderCancel(id: $id) {
            fulfillmentOrder {
              id
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

  // Reschedule Fulfillment Order
  server.registerTool(
    "reschedule_fulfillment_order",
    {
      description: "Reschedule a scheduled fulfillment order to a new date and time.",
      inputSchema: {
        id: z.string().describe("Fulfillment Order ID"),
        fulfillAt: z.string().describe("New fulfillment date and time (ISO 8601 format)"),
      },
    },
    async ({ id, fulfillAt }) => {
      const mutation = `
        mutation FulfillmentOrderReschedule($id: ID!, $fulfillAt: DateTime!) {
          fulfillmentOrderReschedule(id: $id, fulfillAt: $fulfillAt) {
            fulfillmentOrder {
              id
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
        const result = await client.execute(mutation, { id, fulfillAt });

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
