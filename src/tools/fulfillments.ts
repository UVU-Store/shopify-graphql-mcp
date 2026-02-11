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
}
