import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCashTrackingTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Cash Tracking Sessions
  server.registerTool(
    "get_cash_tracking_sessions",
    {
      description: "Fetch cash tracking sessions for POS",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of sessions to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        locationId: z.string().optional().describe("Filter by location ID"),
        startDate: z.string().optional().describe("Start date filter (ISO format)"),
        endDate: z.string().optional().describe("End date filter (ISO format)"),
      },
    },
    async ({ first = 50, after, locationId, startDate, endDate }) => {
      const query = `
        query GetCashTrackingSessions($first: Int!, $after: String, $locationId: ID, $startDate: DateTime, $endDate: DateTime) {
          cashTrackingSessions(first: $first, after: $after, locationId: $locationId, startDate: $startDate, endDate: $endDate) {
            edges {
              node {
                id
                location {
                  id
                  name
                }
                staffMember {
                  id
                  firstName
                  lastName
                  email
                }
                startingCash
                endingCash
                expectedCash
                cashDiscrepancy
                startingTime
                endingTime
                status
                note
                transactions(first: 20) {
                  edges {
                    node {
                      id
                      type
                      amount
                      note
                      createdAt
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
        const result = await client.execute(query, { first, after, locationId, startDate, endDate });
        
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

  // Get Cash Tracking Session
  server.registerTool(
    "get_cash_tracking_session",
    {
      description: "Fetch a specific cash tracking session by ID",
      inputSchema: {
        id: z.string().describe("Cash Tracking Session ID (e.g., 'gid://shopify/CashTrackingSession/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetCashTrackingSession($id: ID!) {
          cashTrackingSession(id: $id) {
            id
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
            staffMember {
              id
              firstName
              lastName
              email
            }
            startingCash
            endingCash
            expectedCash
            cashDiscrepancy
            startingTime
            endingTime
            status
            note
            transactions(first: 100) {
              edges {
                node {
                  id
                  type
                  amount
                  note
                  createdAt
                  paymentMethod
                  referenceNumber
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

  // Create Cash Tracking Session
  server.registerTool(
    "create_cash_tracking_session",
    {
      description: "Create a new cash tracking session for a location",
      inputSchema: {
        locationId: z.string().describe("Location ID"),
        startingCash: z.number().describe("Starting cash amount"),
        note: z.string().optional().describe("Optional note"),
      },
    },
    async ({ locationId, startingCash, note }) => {
      const mutation = `
        mutation CashTrackingSessionCreate($input: CashTrackingSessionCreateInput!) {
          cashTrackingSessionCreate(input: $input) {
            cashTrackingSession {
              id
              location {
                id
                name
              }
              startingCash
              startingTime
              status
              note
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { locationId, startingCash };
      if (note) input.note = note;

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

  // Close Cash Tracking Session
  server.registerTool(
    "close_cash_tracking_session",
    {
      description: "Close a cash tracking session",
      inputSchema: {
        id: z.string().describe("Cash Tracking Session ID"),
        endingCash: z.number().describe("Ending cash amount"),
        note: z.string().optional().describe("Optional note"),
      },
    },
    async ({ id, endingCash, note }) => {
      const mutation = `
        mutation CashTrackingSessionClose($id: ID!, $input: CashTrackingSessionCloseInput!) {
          cashTrackingSessionClose(id: $id, input: $input) {
            cashTrackingSession {
              id
              endingCash
              expectedCash
              cashDiscrepancy
              endingTime
              status
              note
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { endingCash };
      if (note) input.note = note;

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

  // Add Cash Transaction
  server.registerTool(
    "add_cash_transaction",
    {
      description: "Add a cash transaction to a tracking session",
      inputSchema: {
        sessionId: z.string().describe("Cash Tracking Session ID"),
        type: z.enum(["ADD", "REMOVE", "SALE", "REFUND", "PAYOUT"]).describe("Transaction type"),
        amount: z.number().describe("Transaction amount"),
        note: z.string().optional().describe("Optional note"),
        paymentMethod: z.string().optional().describe("Payment method (for non-cash transactions)"),
        referenceNumber: z.string().optional().describe("Reference number"),
      },
    },
    async ({ sessionId, type, amount, note, paymentMethod, referenceNumber }) => {
      const mutation = `
        mutation CashTrackingTransactionAdd($sessionId: ID!, $input: CashTrackingTransactionInput!) {
          cashTrackingTransactionAdd(sessionId: $sessionId, input: $input) {
            cashTrackingTransaction {
              id
              type
              amount
              note
              paymentMethod
              referenceNumber
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { type, amount };
      if (note) input.note = note;
      if (paymentMethod) input.paymentMethod = paymentMethod;
      if (referenceNumber) input.referenceNumber = referenceNumber;

      try {
        const result = await client.execute(mutation, { sessionId, input });
        
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
