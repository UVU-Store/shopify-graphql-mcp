import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerAuditEventTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Audit Events
  server.registerTool(
    "get_audit_events",
    {
      description: "Fetch audit events for the store (staff actions, app installations, etc.)",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of events to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'action:product_create', 'author:user@example.com')"),
        sortKey: z.enum(["CREATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetAuditEvents($first: Int!, $after: String, $query: String, $sortKey: AuditEventSortKeys, $reverse: Boolean) {
          auditEvents(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                createdAt
                action
                description
                category
                author {
                  id
                  firstName
                  lastName
                  email
                }
                subject {
                  id
                  type
                  title
                }
                arguments {
                  key
                  value
                }
                shop {
                  id
                  name
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

  // Get Customer Events
  server.registerTool(
    "get_customer_events",
    {
      description: "Fetch customer events (page views, product views, searches, etc.)",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of events to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'customer_id:123456789', 'event_type:page_view')"),
        sortKey: z.enum(["CREATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
        occurredAtMin: z.string().optional().describe("Minimum occurrence date (ISO format)"),
        occurredAtMax: z.string().optional().describe("Maximum occurrence date (ISO format)"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true, occurredAtMin, occurredAtMax }) => {
      const graphqlQuery = `
        query GetCustomerEvents($first: Int!, $after: String, $query: String, $sortKey: CustomerEventSortKeys, $reverse: Boolean, $occurredAtMin: DateTime, $occurredAtMax: DateTime) {
          customerEvents(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse, occurredAtMin: $occurredAtMin, occurredAtMax: $occurredAtMax) {
            edges {
              node {
                id
                createdAt
                occurredAt
                eventType
                customerJourneySummary {
                  customerVisit {
                    id
                    landingPage
                    landingPageHtml
                    referralCode
                    referralInfoHtml
                    source
                    sourceDescription
                    sourceType
                    utmParameters {
                      campaign
                      content
                      medium
                      source
                      term
                    }
                  }
                }
                shop {
                  id
                  name
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
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse, occurredAtMin, occurredAtMax });
        
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
