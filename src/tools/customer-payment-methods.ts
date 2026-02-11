import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCustomerPaymentMethodTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Customer Payment Methods
  server.registerTool(
    "get_customer_payment_methods",
    {
      description: "Fetch stored payment methods for a customer",
      inputSchema: {
        customerId: z.string().describe("Customer ID"),
        first: z.number().min(1).max(250).optional().describe("Number of methods to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ customerId, first = 50, after }) => {
      const query = `
        query GetCustomerPaymentMethods($customerId: ID!, $first: Int!, $after: String) {
          customer(id: $customerId) {
            id
            firstName
            lastName
            email
            paymentMethods(first: $first, after: $after) {
              edges {
                node {
                  id
                  customer {
                    id
                    firstName
                    lastName
                  }
                  instrument {
                    ... on CustomerCreditCard {
                      brand
                      lastDigits
                      expiryMonth
                      expiryYear
                      name
                      billingAddress {
                        address1
                        city
                        province
                        country
                        zip
                      }
                    }
                    ... on CustomerPaypalBillingAgreement {
                      paypalAccountEmail
                      inactive
                    }
                    ... on CustomerShopPayAgreement {
                      name
                      expiryMonth
                      expiryYear
                      lastDigits
                      brand
                    }
                  }
                  revokedAt
                  revokedReason
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
        const result = await client.execute(query, { customerId, first, after });
        
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

  // Get Customer Payment Method
  server.registerTool(
    "get_customer_payment_method",
    {
      description: "Fetch a specific payment method by ID",
      inputSchema: {
        id: z.string().describe("Payment Method ID (e.g., 'gid://shopify/CustomerPaymentMethod/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetCustomerPaymentMethod($id: ID!) {
          customerPaymentMethod(id: $id) {
            id
            customer {
              id
              firstName
              lastName
              email
            }
            instrument {
              ... on CustomerCreditCard {
                brand
                lastDigits
                expiryMonth
                expiryYear
                name
                billingAddress {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                  phone
                }
              }
              ... on CustomerPaypalBillingAgreement {
                paypalAccountEmail
                inactive
              }
              ... on CustomerShopPayAgreement {
                name
                expiryMonth
                expiryYear
                lastDigits
                brand
              }
            }
            revokedAt
            revokedReason
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

  // Revoke Customer Payment Method
  server.registerTool(
    "revoke_customer_payment_method",
    {
      description: "Revoke a customer's stored payment method",
      inputSchema: {
        id: z.string().describe("Payment Method ID"),
        reason: z.string().optional().describe("Reason for revocation"),
      },
    },
    async ({ id, reason }) => {
      const mutation = `
        mutation CustomerPaymentMethodRevoke($id: ID!, $reason: String) {
          customerPaymentMethodRevoke(id: $id, reason: $reason) {
            revokedCustomerPaymentMethodId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { id, reason });
        
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
