import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerStoreCreditTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Store Credit Account
  server.registerTool(
    "get_store_credit_account",
    {
      description: "Fetch a store credit account by ID",
      inputSchema: {
        id: z.string().describe("Store Credit Account ID (e.g., 'gid://shopify/StoreCreditAccount/123456789')"),
        first: z.number().min(1).max(250).optional().describe("Number of transactions to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination of transactions"),
      },
    },
    async ({ id, first = 50, after }) => {
      const graphqlQuery = `
        query GetStoreCreditAccount($id: ID!, $first: Int!, $after: String) {
          storeCreditAccount(id: $id) {
            id
            balance {
              amount
              currencyCode
            }
            owner {
              ... on Customer {
                id
                firstName
                lastName
                email
              }
              ... on CompanyLocation {
                id
                name
                company {
                  id
                  name
                }
              }
            }
            transactions(first: $first, after: $after) {
              edges {
                node {
                  ... on StoreCreditAccountCreditTransaction {
                    id
                    amount {
                      amount
                      currencyCode
                    }
                    balanceAfterTransaction {
                      amount
                      currencyCode
                    }
                    createdAt
                    event
                    expiresAt
                    remainingAmount {
                      amount
                      currencyCode
                    }
                  }
                  ... on StoreCreditAccountDebitTransaction {
                    id
                    amount {
                      amount
                      currencyCode
                    }
                    balanceAfterTransaction {
                      amount
                      currencyCode
                    }
                    createdAt
                    event
                  }
                  ... on StoreCreditAccountDebitRevertTransaction {
                    id
                    amount {
                      amount
                      currencyCode
                    }
                    balanceAfterTransaction {
                      amount
                      currencyCode
                    }
                    createdAt
                    event
                  }
                  ... on StoreCreditAccountExpirationTransaction {
                    amount {
                      amount
                      currencyCode
                    }
                    balanceAfterTransaction {
                      amount
                      currencyCode
                    }
                    createdAt
                    event
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
        const result = await client.execute(graphqlQuery, { id, first, after });
        
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

  // Get Store Credit Accounts by Owner
  server.registerTool(
    "get_store_credit_accounts_by_owner",
    {
      description: "Fetch all store credit accounts for a customer or company location",
      inputSchema: {
        ownerId: z.string().describe("Owner ID - either Customer ID or CompanyLocation ID"),
        first: z.number().min(1).max(250).optional().describe("Number of accounts to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query for accounts"),
      },
    },
    async ({ ownerId, first = 50, after, query }) => {
      const graphqlQuery = `
        query GetStoreCreditAccountsByOwner($ownerId: ID!, $first: Int!, $after: String, $query: String) {
          customer(id: $ownerId) {
            id
            firstName
            lastName
            email
            storeCreditAccounts(first: $first, after: $after, query: $query) {
              edges {
                node {
                  id
                  balance {
                    amount
                    currencyCode
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
          companyLocation(id: $ownerId) {
            id
            name
            storeCreditAccounts(first: $first, after: $after, query: $query) {
              edges {
                node {
                  id
                  balance {
                    amount
                    currencyCode
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
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { ownerId, first, after, query });
        
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

  // Credit Store Credit Account
  server.registerTool(
    "credit_store_credit_account",
    {
      description: "Add funds to a store credit account. Creates the account automatically if it doesn't exist.",
      inputSchema: {
        id: z.string().describe("Store Credit Account ID, Customer ID, or CompanyLocation ID"),
        creditAmount: z.number().describe("Amount to credit"),
        currencyCode: z.string().describe("Currency code (e.g., 'USD')"),
        expiresAt: z.string().optional().describe("Optional expiration date (ISO 8601 format)"),
        notify: z.boolean().optional().describe("Send notification to account owner (default: false)"),
      },
    },
    async ({ id, creditAmount, currencyCode, expiresAt, notify = false }) => {
      const mutation = `
        mutation StoreCreditAccountCredit($id: ID!, $creditInput: StoreCreditAccountCreditInput!) {
          storeCreditAccountCredit(id: $id, creditInput: $creditInput) {
            storeCreditAccountTransaction {
              ... on StoreCreditAccountCreditTransaction {
                id
                account {
                  id
                  balance {
                    amount
                    currencyCode
                  }
                  owner {
                    ... on Customer {
                      id
                      firstName
                      lastName
                    }
                    ... on CompanyLocation {
                      id
                      name
                    }
                  }
                }
                amount {
                  amount
                  currencyCode
                }
                balanceAfterTransaction {
                  amount
                  currencyCode
                }
                createdAt
                event
                expiresAt
                remainingAmount {
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

      const creditInput = {
        creditAmount: {
          amount: creditAmount.toString(),
          currencyCode,
        },
        notify,
      };

      if (expiresAt) {
        (creditInput as Record<string, unknown>).expiresAt = expiresAt;
      }

      try {
        const result = await client.execute(mutation, { id, creditInput });
        
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

  // Debit Store Credit Account
  server.registerTool(
    "debit_store_credit_account",
    {
      description: "Debit funds from a store credit account",
      inputSchema: {
        id: z.string().describe("Store Credit Account ID"),
        debitAmount: z.number().describe("Amount to debit"),
        currencyCode: z.string().describe("Currency code (e.g., 'USD')"),
      },
    },
    async ({ id, debitAmount, currencyCode }) => {
      const mutation = `
        mutation StoreCreditAccountDebit($id: ID!, $debitInput: StoreCreditAccountDebitInput!) {
          storeCreditAccountDebit(id: $id, debitInput: $debitInput) {
            storeCreditAccountTransaction {
              ... on StoreCreditAccountDebitTransaction {
                id
                account {
                  id
                  balance {
                    amount
                    currencyCode
                  }
                  owner {
                    ... on Customer {
                      id
                      firstName
                      lastName
                    }
                    ... on CompanyLocation {
                      id
                      name
                    }
                  }
                }
                amount {
                  amount
                  currencyCode
                }
                balanceAfterTransaction {
                  amount
                  currencyCode
                }
                createdAt
                event
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const debitInput = {
        debitAmount: {
          amount: debitAmount.toString(),
          currencyCode,
        },
      };

      try {
        const result = await client.execute(mutation, { id, debitInput });
        
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
