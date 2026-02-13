import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerShopifyPaymentsTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Shopify Payments Account
  server.registerTool(
    "get_shopify_payments_account",
    {
      description: "Fetch Shopify Payments account information including balances and configuration",
      inputSchema: {},
    },
    async () => {
      const graphqlQuery = `
        query GetShopifyPaymentsAccount {
          shopifyPaymentsAccount {
            id
            activated
            onboardable
            accountOpenerName
            country
            defaultCurrency
            balance {
              amount
              currencyCode
            }
            payoutSchedule {
              interval
              monthlyAnchor
              weeklyAnchor
            }
            chargeStatementDescriptors {
              default
              prefix
            }
            payoutStatementDescriptor
            bankAccounts(first: 10) {
              edges {
                node {
                  id
                  accountNumberLastDigits
                  bankName
                  country
                  currency
                  status
                  createdAt
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, {});
        
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

  // Get Balance Transactions
  server.registerTool(
    "get_shopify_payments_balance_transactions",
    {
      description: "Fetch Shopify Payments balance transactions",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of transactions to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query for balance transactions"),
        sortKey: z.enum(["PROCESSED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
        hideTransfers: z.boolean().optional().describe("Hide transfer transactions"),
      },
    },
    async ({ first = 50, after, query, sortKey = "PROCESSED_AT", reverse = true, hideTransfers = false }) => {
      const graphqlQuery = `
        query GetBalanceTransactions($first: Int!, $after: String, $query: String, $sortKey: BalanceTransactionSortKeys, $reverse: Boolean, $hideTransfers: Boolean) {
          shopifyPaymentsAccount {
            id
            balanceTransactions(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse, hideTransfers: $hideTransfers) {
              edges {
                node {
                  id
                  amount {
                    amount
                    currencyCode
                  }
                  fee {
                    amount
                    currencyCode
                  }
                  net {
                    amount
                    currencyCode
                  }
                  transactionDate
                  type
                  sourceType
                  sourceId
                  sourceOrderTransactionId
                  test
                  adjustmentReason
                  associatedOrder {
                    id
                    name
                  }
                  associatedPayout {
                    id
                    status
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse, hideTransfers });
        
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

  // Get Payouts
  server.registerTool(
    "get_shopify_payments_payouts",
    {
      description: "Fetch Shopify Payments payouts",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of payouts to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query for payouts"),
        sortKey: z.enum(["ISSUED_AT", "ID", "AMOUNT"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
        transactionType: z.enum(["PAYOUT", "REFUND", "ADJUSTMENT", "CHARGEBACK", "CHARGEBACK_REVERSAL"]).optional().describe("Filter by transaction type"),
      },
    },
    async ({ first = 50, after, query, sortKey = "ISSUED_AT", reverse = true, transactionType }) => {
      const graphqlQuery = `
        query GetPayouts($first: Int!, $after: String, $query: String, $sortKey: PayoutSortKeys, $reverse: Boolean, $transactionType: ShopifyPaymentsPayoutTransactionType) {
          shopifyPaymentsAccount {
            id
            payouts(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse, transactionType: $transactionType) {
              edges {
                node {
                  id
                  legacyResourceId
                  issuedAt
                  status
                  transactionType
                  net {
                    amount
                    currencyCode
                  }
                  externalTraceId
                  businessEntity {
                    id
                  }
                  summary {
                    adjustmentsFee {
                      amount
                      currencyCode
                    }
                    adjustmentsGross {
                      amount
                      currencyCode
                    }
                    advanceFees {
                      amount
                      currencyCode
                    }
                    advanceGross {
                      amount
                      currencyCode
                    }
                    chargesFee {
                      amount
                      currencyCode
                    }
                    chargesGross {
                      amount
                      currencyCode
                    }
                    refundsFee {
                      amount
                      currencyCode
                    }
                    refundsFeeGross {
                      amount
                      currencyCode
                    }
                    reservedFundsFee {
                      amount
                      currencyCode
                    }
                    reservedFundsGross {
                      amount
                      currencyCode
                    }
                    retriedPayoutsFee {
                      amount
                      currencyCode
                    }
                    retriedPayoutsGross {
                      amount
                      currencyCode
                    }
                    usdcRebateCreditAmount {
                      amount
                      currencyCode
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse, transactionType });
        
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

  // Get Disputes
  server.registerTool(
    "get_shopify_payments_disputes",
    {
      description: "Fetch Shopify Payments disputes",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of disputes to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query for disputes"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, reverse = true }) => {
      const graphqlQuery = `
        query GetDisputes($first: Int!, $after: String, $query: String, $reverse: Boolean) {
          shopifyPaymentsAccount {
            id
            disputes(first: $first, after: $after, query: $query, reverse: $reverse) {
              edges {
                node {
                  id
                  legacyResourceId
                  initiatedAt
                  evidenceDueBy
                  evidenceSentOn
                  finalizedOn
                  status
                  type
                  amount {
                    amount
                    currencyCode
                  }
                  order {
                    id
                    name
                    customer {
                      id
                      firstName
                      lastName
                      email
                    }
                  }
                  disputeEvidence {
                    id
                    submitted
                    customerFirstName
                    customerLastName
                    customerEmailAddress
                    customerPurchaseIp
                    productDescription
                    accessActivityLog
                    cancellationPolicyDisclosure
                    cancellationRebuttal
                    refundPolicyDisclosure
                    refundRefusalExplanation
                    uncategorizedText
                    billingAddress {
                      address1
                      address2
                      city
                      province
                      country
                      zip
                    }
                    shippingAddress {
                      address1
                      address2
                      city
                      province
                      country
                      zip
                    }
                  }
                  reasonDetails {
                    networkReasonCode
                    reason
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after, query, reverse });
        
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

  // Get Bank Accounts
  server.registerTool(
    "get_shopify_payments_bank_accounts",
    {
      description: "Fetch bank accounts configured for Shopify Payments",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of bank accounts to fetch (1-250, default: 10)"),
        after: z.string().optional().describe("Cursor for pagination"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 10, after, reverse = false }) => {
      const graphqlQuery = `
        query GetBankAccounts($first: Int!, $after: String, $reverse: Boolean) {
          shopifyPaymentsAccount {
            id
            bankAccounts(first: $first, after: $after, reverse: $reverse) {
              edges {
                node {
                  id
                  accountNumberLastDigits
                  bankName
                  country
                  currency
                  status
                  createdAt
                  payouts(first: 5) {
                    edges {
                      node {
                        id
                        issuedAt
                        status
                        net {
                          amount
                          currencyCode
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
                startCursor
                endCursor
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { first, after, reverse });
        
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

  // Create Alternate Currency Payout
  server.registerTool(
    "create_shopify_payments_alternate_currency_payout",
    {
      description: "Create an alternate currency payout for a Shopify Payments account",
      inputSchema: {
        currency: z.string().describe("Currency code for the payout (e.g., 'USD', 'EUR')"),
        accountId: z.string().optional().describe("Optional Shopify Payments account ID (if not using default)"),
      },
    },
    async ({ currency, accountId }) => {
      const mutation = `
        mutation CreateAlternateCurrencyPayout($currency: CurrencyCode!, $accountId: ID) {
          shopifyPaymentsPayoutAlternateCurrencyCreate(currency: $currency, accountId: $accountId) {
            payout {
              amount {
                amount
                currencyCode
              }
              currency
              arrivalDate
              createdAt
              remoteId
            }
            success
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { currency, accountId });
        
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
