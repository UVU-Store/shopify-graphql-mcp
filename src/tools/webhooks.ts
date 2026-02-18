import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerWebhookTools(server: McpServer, client: ShopifyGraphQLClient) {
  // List Webhook Subscriptions
  server.registerTool(
    "list_webhook_subscriptions",
    {
      description: "List all webhook subscriptions for the current app and shop. Returns only shop-scoped subscriptions, not app-scoped subscriptions.",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of subscriptions to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        topic: z.string().optional().describe("Filter by topic (e.g., 'ORDERS_CREATE', 'PRODUCTS_UPDATE')"),
        uri: z.string().optional().describe("Filter by webhook URI"),
      },
    },
    async ({ first = 50, after, topic, uri }) => {
      const query = `
        query GetWebhookSubscriptions($first: Int!, $after: String, $query: String, $uri: String, $topics: [WebhookSubscriptionTopic!]) {
          webhookSubscriptions(first: $first, after: $after, query: $query, uri: $uri, topics: $topics) {
            edges {
              node {
                id
                topic
                uri
                filter
                includeFields
                metafieldNamespaces
                format
                createdAt
                updatedAt
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
        const result = await client.execute(query, { 
          first, 
          after, 
          query: topic ? `topic:${topic}` : undefined,
          uri,
          topics: topic ? [topic] : undefined
        });

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

  // Get Webhook Subscription
  server.registerTool(
    "get_webhook_subscription",
    {
      description: "Get a specific webhook subscription by ID",
      inputSchema: {
        id: z.string().describe("Webhook subscription ID (e.g., 'gid://shopify/WebhookSubscription/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetWebhookSubscription($id: ID!) {
          webhookSubscription(id: $id) {
            id
            topic
            uri
            filter
            includeFields
            metafieldNamespaces
            format
            createdAt
            updatedAt
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

  // Create Webhook Subscription
  server.registerTool(
    "create_webhook_subscription",
    {
      description: "Create a webhook subscription. Supports HTTPS URLs, Google Pub/Sub topics (pubsub://project:topic), and AWS EventBridge (arn:aws:events:...).",
      inputSchema: {
        topic: z.string().describe("Webhook topic (e.g., 'ORDERS_CREATE', 'PRODUCTS_UPDATE', 'APP_UNINSTALLED')"),
        uri: z.string().describe("Webhook endpoint URI. Can be HTTPS URL, Pub/Sub (pubsub://project:topic), or EventBridge ARN"),
        filter: z.string().optional().describe("Filter expression using Shopify search syntax (e.g., 'type:lookbook')"),
        includeFields: z.array(z.string()).optional().describe("Specific fields to include in webhook payload (limits payload size)"),
        metafieldNamespaces: z.array(z.string()).optional().describe("Metafield namespaces to include in webhook payload"),
      },
    },
    async ({ topic, uri, filter, includeFields, metafieldNamespaces }) => {
      const mutation = `
        mutation WebhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
            webhookSubscription {
              id
              topic
              uri
              filter
              includeFields
              metafieldNamespaces
              format
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const webhookSubscription: Record<string, unknown> = { uri };
      if (filter) webhookSubscription.filter = filter;
      if (includeFields) webhookSubscription.includeFields = includeFields;
      if (metafieldNamespaces) webhookSubscription.metafieldNamespaces = metafieldNamespaces;

      try {
        const result = await client.execute(mutation, { topic, webhookSubscription });

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

  // Update Webhook Subscription
  server.registerTool(
    "update_webhook_subscription",
    {
      description: "Update an existing webhook subscription. You can change the endpoint URL, filters, included fields, or metafield namespaces without recreating the subscription.",
      inputSchema: {
        id: z.string().describe("Webhook subscription ID (e.g., 'gid://shopify/WebhookSubscription/123456789')"),
        uri: z.string().optional().describe("New webhook endpoint URI"),
        filter: z.string().optional().describe("New filter expression"),
        includeFields: z.array(z.string()).optional().describe("Specific fields to include in webhook payload"),
        metafieldNamespaces: z.array(z.string()).optional().describe("Metafield namespaces to include"),
      },
    },
    async ({ id, uri, filter, includeFields, metafieldNamespaces }) => {
      const mutation = `
        mutation WebhookSubscriptionUpdate($id: ID!, $webhookSubscription: WebhookSubscriptionInput!) {
          webhookSubscriptionUpdate(id: $id, webhookSubscription: $webhookSubscription) {
            webhookSubscription {
              id
              topic
              uri
              filter
              includeFields
              metafieldNamespaces
              format
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const webhookSubscription: Record<string, unknown> = {};
      if (uri) webhookSubscription.uri = uri;
      if (filter) webhookSubscription.filter = filter;
      if (includeFields) webhookSubscription.includeFields = includeFields;
      if (metafieldNamespaces) webhookSubscription.metafieldNamespaces = metafieldNamespaces;

      try {
        const result = await client.execute(mutation, { id, webhookSubscription });

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

  // Delete Webhook Subscription
  server.registerTool(
    "delete_webhook_subscription",
    {
      description: "Delete a webhook subscription and stop all future webhooks to its endpoint",
      inputSchema: {
        id: z.string().describe("Webhook subscription ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation WebhookSubscriptionDelete($id: ID!) {
          webhookSubscriptionDelete(id: $id) {
            deletedWebhookSubscriptionId
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
}
