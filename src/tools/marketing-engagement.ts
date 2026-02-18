import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerMarketingEngagementTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Create Marketing Engagement
  server.registerTool(
    "create_marketing_engagement",
    {
      description: "Create a marketing engagement for a marketing activity or channel. Tracks customer interactions like clicks, impressions, conversions, sales, and orders. Requires write_marketing_events scope.",
      inputSchema: {
        // Required fields
        occurredOn: z.string().describe("The calendar date for which the metrics are being reported (ISO 8601 format, e.g., '2018-06-29')"),
        utcOffset: z.string().describe("The UTC offset for the time zone in which the metrics are being reported (format: '+HH:MM' or '-HH:MM', e.g., '-07:00')"),
        isCumulative: z.boolean().describe("Whether metrics have been aggregated from the first day of reporting up to occurredOn (true) or aggregated over a single day (false). Non-cumulative is preferred."),
        
        // Target identification (one of these required)
        marketingActivityId: z.string().optional().describe("The ID of the marketing activity for activity-level engagements (e.g., 'gid://shopify/MarketingActivity/123456'). Either this or remoteId should be set for activity-level, not both."),
        remoteId: z.string().optional().describe("A custom unique identifier for the marketing activity. Either this or marketingActivityId should be set for activity-level engagements."),
        channelHandle: z.string().optional().describe("The unique string identifier of the channel for channel-level engagements. Set when providing channel-level engagements only."),
        
        // Optional engagement metrics
        adSpendAmount: z.number().optional().describe("The total ad spend amount for the marketing content"),
        adSpendCurrencyCode: z.string().optional().describe("The currency code for ad spend (e.g., 'USD', 'CAD', 'EUR')"),
        clicksCount: z.number().int().optional().describe("Total number of interactions/clicks on the marketing content"),
        commentsCount: z.number().int().optional().describe("Total number of comments on the marketing content"),
        complaintsCount: z.number().int().optional().describe("Total number of complaints (spam reports, dislikes)"),
        failsCount: z.number().int().optional().describe("Total number of fails (bounced emails/messages)"),
        favoritesCount: z.number().int().optional().describe("Total number of favorites, likes, saves, or bookmarks"),
        impressionsCount: z.number().int().optional().describe("Total number of times content was displayed"),
        sendsCount: z.number().int().optional().describe("Total number of marketing emails or messages sent"),
        sharesCount: z.number().int().optional().describe("Total number of times content was shared or reposted"),
        uniqueClicksCount: z.number().int().optional().describe("Total number of unique clicks"),
        uniqueViewsCount: z.number().int().optional().describe("Total number of unique users who saw the content"),
        viewsCount: z.number().int().optional().describe("Total number of views (email opens, video plays)"),
        unsubscribesCount: z.number().int().optional().describe("Total number of unsubscribes/unfollows"),
        
        // Conversion metrics
        sessionsCount: z.number().int().optional().describe("Number of online store sessions generated"),
        salesAmount: z.number().optional().describe("Amount of sales generated from the marketing content"),
        salesCurrencyCode: z.string().optional().describe("Currency code for sales amount"),
        orders: z.number().optional().describe("Number of orders generated"),
        firstTimeCustomers: z.number().optional().describe("Number of first-time customers who placed orders"),
        returningCustomers: z.number().optional().describe("Number of returning customers who placed orders"),
      },
    },
    async ({
      occurredOn,
      utcOffset,
      isCumulative,
      marketingActivityId,
      remoteId,
      channelHandle,
      adSpendAmount,
      adSpendCurrencyCode,
      clicksCount,
      commentsCount,
      complaintsCount,
      failsCount,
      favoritesCount,
      impressionsCount,
      sendsCount,
      sharesCount,
      uniqueClicksCount,
      uniqueViewsCount,
      viewsCount,
      unsubscribesCount,
      sessionsCount,
      salesAmount,
      salesCurrencyCode,
      orders,
      firstTimeCustomers,
      returningCustomers,
    }) => {
      // Validate that exactly one targeting method is provided
      const activityLevelTargets = [marketingActivityId, remoteId].filter(Boolean).length;
      const hasChannelHandle = !!channelHandle;
      
      if (activityLevelTargets > 0 && hasChannelHandle) {
        return {
          content: [{ type: "text", text: "Error: Cannot specify both activity-level (marketingActivityId/remoteId) and channel-level (channelHandle) targets. Choose one." }],
        };
      }
      
      if (activityLevelTargets === 0 && !hasChannelHandle) {
        return {
          content: [{ type: "text", text: "Error: Must specify either activity-level (marketingActivityId or remoteId) OR channel-level (channelHandle) target." }],
        };
      }
      
      if (activityLevelTargets > 1) {
        return {
          content: [{ type: "text", text: "Error: Cannot specify both marketingActivityId and remoteId. Choose one." }],
        };
      }

      // Build marketing engagement input
      const marketingEngagement: Record<string, unknown> = {
        occurredOn,
        utcOffset,
        isCumulative,
      };

      // Add optional metrics
      if (adSpendAmount !== undefined && adSpendCurrencyCode) {
        marketingEngagement.adSpend = {
          amount: adSpendAmount.toString(),
          currencyCode: adSpendCurrencyCode,
        };
      }

      if (clicksCount !== undefined) marketingEngagement.clicksCount = clicksCount;
      if (commentsCount !== undefined) marketingEngagement.commentsCount = commentsCount;
      if (complaintsCount !== undefined) marketingEngagement.complaintsCount = complaintsCount;
      if (failsCount !== undefined) marketingEngagement.failsCount = failsCount;
      if (favoritesCount !== undefined) marketingEngagement.favoritesCount = favoritesCount;
      if (impressionsCount !== undefined) marketingEngagement.impressionsCount = impressionsCount;
      if (sendsCount !== undefined) marketingEngagement.sendsCount = sendsCount;
      if (sharesCount !== undefined) marketingEngagement.sharesCount = sharesCount;
      if (uniqueClicksCount !== undefined) marketingEngagement.uniqueClicksCount = uniqueClicksCount;
      if (uniqueViewsCount !== undefined) marketingEngagement.uniqueViewsCount = uniqueViewsCount;
      if (viewsCount !== undefined) marketingEngagement.viewsCount = viewsCount;
      if (unsubscribesCount !== undefined) marketingEngagement.unsubscribesCount = unsubscribesCount;

      // Add conversion metrics
      if (sessionsCount !== undefined) marketingEngagement.sessionsCount = sessionsCount;
      
      if (salesAmount !== undefined && salesCurrencyCode) {
        marketingEngagement.sales = {
          amount: salesAmount.toString(),
          currencyCode: salesCurrencyCode,
        };
      }
      
      if (orders !== undefined) marketingEngagement.orders = orders;
      if (firstTimeCustomers !== undefined) marketingEngagement.firstTimeCustomers = firstTimeCustomers;
      if (returningCustomers !== undefined) marketingEngagement.returningCustomers = returningCustomers;

      const mutation = `
        mutation MarketingEngagementCreate(
          $marketingEngagement: MarketingEngagementInput!,
          $marketingActivityId: ID,
          $channelHandle: String,
          $remoteId: String
        ) {
          marketingEngagementCreate(
            marketingEngagement: $marketingEngagement,
            marketingActivityId: $marketingActivityId,
            channelHandle: $channelHandle,
            remoteId: $remoteId
          ) {
            marketingEngagement {
              occurredOn
              utcOffset
              isCumulative
              adSpend {
                amount
                currencyCode
              }
              clicksCount
              impressionsCount
              commentsCount
              favoritesCount
              unsubscribesCount
              complaintsCount
              failsCount
              sendsCount
              uniqueViewsCount
              uniqueClicksCount
              sharesCount
              viewsCount
              sessionsCount
              sales {
                amount
                currencyCode
              }
              orders
              firstTimeCustomers
              returningCustomers
              marketingActivity {
                id
              }
              channelHandle
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, {
          marketingEngagement,
          marketingActivityId: marketingActivityId || null,
          channelHandle: channelHandle || null,
          remoteId: remoteId || null,
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

  // Delete Marketing Engagements (Channel-level only)
  server.registerTool(
    "delete_marketing_engagements",
    {
      description: "Delete all channel-level marketing engagement data. Marks data such that it no longer appears in reports. Activity-level data cannot be deleted directly - delete the MarketingActivity instead. Requires write_marketing_events scope.",
      inputSchema: {
        channelHandle: z.string().optional().describe("The handle of the channel for which engagement data should be deleted"),
        deleteEngagementsForAllChannels: z.boolean().optional().describe("When true, deletes engagements for all channels that belong to the API client"),
      },
    },
    async ({ channelHandle, deleteEngagementsForAllChannels = false }) => {
      // Validate that at least one deletion method is specified
      if (!channelHandle && !deleteEngagementsForAllChannels) {
        return {
          content: [{ type: "text", text: "Error: Must specify either channelHandle or set deleteEngagementsForAllChannels to true." }],
        };
      }

      const mutation = `
        mutation MarketingEngagementsDelete(
          $channelHandle: String,
          $deleteEngagementsForAllChannels: Boolean
        ) {
          marketingEngagementsDelete(
            channelHandle: $channelHandle,
            deleteEngagementsForAllChannels: $deleteEngagementsForAllChannels
          ) {
            result
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, {
          channelHandle: channelHandle || null,
          deleteEngagementsForAllChannels,
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
}
