import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerGiftCardTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Gift Cards
  server.registerTool(
    "get_gift_cards",
    {
      description: "Fetch gift cards from the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of gift cards to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'status:active', 'code:MYGIFT')"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "ID", "BALANCE"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetGiftCards($first: Int!, $after: String, $query: String, $sortKey: GiftCardSortKeys, $reverse: Boolean) {
          giftCards(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                code
                balanceV2 {
                  amount
                  currencyCode
                }
                presentmentBalanceV2 {
                  amount
                  currencyCode
                }
                createdAt
                updatedAt
                expiresAt
                disabledAt
                templateSuffix
                initialValueV2 {
                  amount
                  currencyCode
                }
                customer {
                  id
                  firstName
                  lastName
                  email
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

  // Get Gift Card
  server.registerTool(
    "get_gift_card",
    {
      description: "Fetch a specific gift card by ID",
      inputSchema: {
        id: z.string().describe("Gift Card ID (e.g., 'gid://shopify/GiftCard/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetGiftCard($id: ID!) {
          giftCard(id: $id) {
            id
            code
            balanceV2 {
              amount
              currencyCode
            }
            presentmentBalanceV2 {
              amount
              currencyCode
            }
            createdAt
            updatedAt
            expiresAt
            disabledAt
            templateSuffix
            initialValueV2 {
              amount
              currencyCode
            }
            customer {
              id
              firstName
              lastName
              email
            }
            transactions(first: 50) {
              edges {
                node {
                  id
                  createdAt
                  amountV2 {
                    amount
                    currencyCode
                  }
                  balanceV2 {
                    amount
                    currencyCode
                  }
                  event
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

  // Create Gift Card
  server.registerTool(
    "create_gift_card",
    {
      description: "Create a new gift card",
      inputSchema: {
        initialValue: z.number().describe("Initial value of the gift card"),
        code: z.string().optional().describe("Custom code (optional, auto-generated if not provided)"),
        note: z.string().optional().describe("Internal note"),
        expiresAt: z.string().optional().describe("Expiration date (ISO 8601 format)"),
        customerId: z.string().optional().describe("Associate with a customer"),
      },
    },
    async ({ initialValue, code, note, expiresAt, customerId }) => {
      const mutation = `
        mutation GiftCardCreate($input: GiftCardCreateInput!) {
          giftCardCreate(input: $input) {
            giftCard {
              id
              code
              balanceV2 {
                amount
                currencyCode
              }
              initialValueV2 {
                amount
                currencyCode
              }
              createdAt
              expiresAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { initialValueV2: { amount: initialValue.toString() } };
      if (code) input.code = code;
      if (note) input.note = note;
      if (expiresAt) input.expiresAt = expiresAt;
      if (customerId) input.customerId = customerId;

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

  // Update Gift Card
  server.registerTool(
    "update_gift_card",
    {
      description: "Update an existing gift card",
      inputSchema: {
        id: z.string().describe("Gift Card ID"),
        note: z.string().optional().describe("Internal note"),
        expiresAt: z.string().optional().describe("Expiration date (ISO 8601 format)"),
      },
    },
    async ({ id, note, expiresAt }) => {
      const mutation = `
        mutation GiftCardUpdate($id: ID!, $input: GiftCardUpdateInput!) {
          giftCardUpdate(id: $id, input: $input) {
            giftCard {
              id
              note
              expiresAt
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
      if (note !== undefined) input.note = note;
      if (expiresAt !== undefined) input.expiresAt = expiresAt;

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

  // Disable Gift Card
  server.registerTool(
    "disable_gift_card",
    {
      description: "Disable a gift card",
      inputSchema: {
        id: z.string().describe("Gift Card ID to disable"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation GiftCardDisable($id: ID!) {
          giftCardDisable(id: $id) {
            giftCard {
              id
              disabledAt
              balanceV2 {
                amount
                currencyCode
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

  // Get Gift Card Transactions
  server.registerTool(
    "get_gift_card_transactions",
    {
      description: "Fetch gift card transactions",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of transactions to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        giftCardId: z.string().optional().describe("Filter by gift card ID"),
      },
    },
    async ({ first = 50, after, giftCardId }) => {
      const query = `
        query GetGiftCardTransactions($first: Int!, $after: String, $giftCardId: ID) {
          giftCardTransactions(first: $first, after: $after, giftCardId: $giftCardId) {
            edges {
              node {
                id
                createdAt
                amountV2 {
                  amount
                  currencyCode
                }
                balanceV2 {
                  amount
                  currencyCode
                }
                event
                giftCard {
                  id
                  code
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
        const result = await client.execute(query, { first, after, giftCardId });
        
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
