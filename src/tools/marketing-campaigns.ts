import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerMarketingCampaignTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Marketing Events
  server.registerTool(
    "get_marketing_events",
    {
      description: "Fetch marketing events for the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of events to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "ID", "START_DATE"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetMarketingEvents($first: Int!, $after: String, $query: String, $sortKey: MarketingEventSortKeys, $reverse: Boolean) {
          marketingEvents(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                name
                eventType
                description
                startDate
                endDate
                status
                createdAt
                updatedAt
                budget
                budgetType
                channel {
                  id
                  name
                }
                marketingActivityEngagements {
                  totalEngagements
                  clicks
                  impressions
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

  // Get Marketing Event
  server.registerTool(
    "get_marketing_event",
    {
      description: "Fetch a specific marketing event by ID",
      inputSchema: {
        id: z.string().describe("Marketing Event ID (e.g., 'gid://shopify/MarketingEvent/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetMarketingEvent($id: ID!) {
          marketingEvent(id: $id) {
            id
            name
            eventType
            description
            startDate
            endDate
            status
            createdAt
            updatedAt
            budget
            budgetType
            channel {
              id
              name
            }
            marketingActivities(first: 20) {
              edges {
                node {
                  id
                  name
                  status
                  target
                  url
                }
              }
            }
            marketingActivityEngagements {
              totalEngagements
              clicks
              impressions
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

  // Create Marketing Event
  server.registerTool(
    "create_marketing_event",
    {
      description: "Create a new marketing event",
      inputSchema: {
        name: z.string().describe("Event name"),
        eventType: z.string().describe("Event type (e.g., 'email', 'social', 'display')"),
        description: z.string().optional().describe("Event description"),
        startDate: z.string().describe("Start date (ISO 8601 format)"),
        endDate: z.string().optional().describe("End date (ISO 8601 format)"),
        channelId: z.string().optional().describe("Channel ID"),
        budget: z.number().optional().describe("Budget amount"),
        budgetType: z.enum(["daily", "monthly", "total"]).optional().describe("Budget type"),
      },
    },
    async ({ name, eventType, description, startDate, endDate, channelId, budget, budgetType }) => {
      const mutation = `
        mutation MarketingEventCreate($input: MarketingEventInput!) {
          marketingEventCreate(input: $input) {
            marketingEvent {
              id
              name
              eventType
              startDate
              endDate
              status
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { name, eventType, startDate };
      if (description) input.description = description;
      if (endDate) input.endDate = endDate;
      if (channelId) input.channelId = channelId;
      if (budget) input.budget = budget;
      if (budgetType) input.budgetType = budgetType;

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

  // Update Marketing Event
  server.registerTool(
    "update_marketing_event",
    {
      description: "Update an existing marketing event",
      inputSchema: {
        id: z.string().describe("Marketing Event ID"),
        name: z.string().optional().describe("Event name"),
        description: z.string().optional().describe("Event description"),
        startDate: z.string().optional().describe("Start date"),
        endDate: z.string().optional().describe("End date"),
        status: z.enum(["active", "scheduled", "completed", "draft"]).optional().describe("Event status"),
        budget: z.number().optional().describe("Budget amount"),
        budgetType: z.enum(["daily", "monthly", "total"]).optional().describe("Budget type"),
      },
    },
    async ({ id, name, description, startDate, endDate, status, budget, budgetType }) => {
      const mutation = `
        mutation MarketingEventUpdate($id: ID!, $input: MarketingEventInput!) {
          marketingEventUpdate(id: $id, input: $input) {
            marketingEvent {
              id
              name
              eventType
              status
              updatedAt
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
      if (description !== undefined) input.description = description;
      if (startDate) input.startDate = startDate;
      if (endDate !== undefined) input.endDate = endDate;
      if (status) input.status = status;
      if (budget !== undefined) input.budget = budget;
      if (budgetType) input.budgetType = budgetType;

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

  // Delete Marketing Event
  server.registerTool(
    "delete_marketing_event",
    {
      description: "Delete a marketing event",
      inputSchema: {
        id: z.string().describe("Marketing Event ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation MarketingEventDelete($id: ID!) {
          marketingEventDelete(id: $id) {
            deletedMarketingEventId
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

  // Get Marketing Integrated Campaigns
  server.registerTool(
    "get_marketing_integrated_campaigns",
    {
      description: "Fetch marketing integrated campaigns",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetMarketingIntegratedCampaigns($first: Int!, $after: String) {
          marketingIntegratedCampaigns(first: $first, after: $after) {
            edges {
              node {
                id
                name
                status
                startDate
                endDate
                channel {
                  id
                  name
                }
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
}
