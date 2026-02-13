import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerSubscriptionTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Subscription Contracts
  server.registerTool(
    "get_subscription_contracts",
    {
      description: "Fetch subscription contracts from the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of contracts to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query for subscription contracts"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetSubscriptionContracts($first: Int!, $after: String, $query: String, $sortKey: SubscriptionContractsSortKeys, $reverse: Boolean) {
          subscriptionContracts(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                status
                createdAt
                updatedAt
                currencyCode
                customer {
                  id
                  firstName
                  lastName
                  email
                }
                nextBillingDate
                lastPaymentStatus
                lines(first: 10) {
                  edges {
                    node {
                      id
                      productId
                      variantId
                      title
                      quantity
                      currentPrice {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
                billingPolicy {
                  interval
                  intervalCount
                }
                deliveryPolicy {
                  interval
                  intervalCount
                }
                deliveryPrice {
                  amount
                  currencyCode
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

  // Get Subscription Contract
  server.registerTool(
    "get_subscription_contract",
    {
      description: "Fetch a specific subscription contract by ID",
      inputSchema: {
        id: z.string().describe("Subscription Contract ID (e.g., 'gid://shopify/SubscriptionContract/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetSubscriptionContract($id: ID!) {
          subscriptionContract(id: $id) {
            id
            status
            createdAt
            updatedAt
            currencyCode
            revisionId
            customer {
              id
              firstName
              lastName
              email
            }
            nextBillingDate
            lastBillingAttemptErrorType
            lastPaymentStatus
            note
            customAttributes {
              key
              value
            }
            originOrder {
              id
              name
            }
            lines(first: 50) {
              edges {
                node {
                  id
                  productId
                  variantId
                  title
                  quantity
                  currentPrice {
                    amount
                    currencyCode
                  }
                  pricingPolicy {
                    basePrice {
                      amount
                      currencyCode
                    }
                  }
                }
                cursor
              }
            }
            billingPolicy {
              interval
              intervalCount
              minCycles
              maxCycles
            }
            deliveryPolicy {
              interval
              intervalCount
            }
            deliveryMethod {
              ... on SubscriptionDeliveryMethodShipping {
                address {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                }
                shippingOption {
                  code
                  title
                  description
                  carrierService {
                    id
                    name
                  }
                }
              }
              ... on SubscriptionDeliveryMethodPickup {
                pickupOption {
                  code
                  title
                  description
                  location {
                    id
                    name
                  }
                }
              }
              ... on SubscriptionDeliveryMethodLocalDelivery {
                address {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                }
                localDeliveryOption {
                  code
                  title
                  description
                }
              }
            }
            deliveryPrice {
              amount
              currencyCode
            }
            customerPaymentMethod {
              id
              instrument {
                ... on CustomerCreditCard {
                  lastDigits
                  brand
                  expiryMonth
                  expiryYear
                }
                ... on CustomerPaypalBillingAgreement {
                  paypalAccountEmail
                }
                ... on CustomerShopPayAgreement {
                  lastDigits
                  expiryMonth
                  expiryYear
                }
              }
            }
            billingAttempts(first: 10) {
              edges {
                node {
                  id
                  createdAt
                  errorCode
                  errorMessage
                  nextActionUrl
                  ready
                  order {
                    id
                    name
                  }
                }
              }
            }
            orders(first: 10) {
              edges {
                node {
                  id
                  name
                  createdAt
                  displayFinancialStatus
                  totalPrice
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

  // Create Subscription Contract
  server.registerTool(
    "create_subscription_contract",
    {
      description: "Create a new subscription contract",
      inputSchema: {
        customerId: z.string().describe("Customer ID to associate with the subscription"),
        currencyCode: z.string().describe("Currency code (e.g., 'USD')"),
        nextBillingDate: z.string().describe("Next billing date (ISO 8601 format)"),
      },
    },
    async ({ customerId, currencyCode, nextBillingDate }) => {
      const mutation = `
        mutation SubscriptionContractCreate($input: SubscriptionContractCreateInput!) {
          subscriptionContractCreate(input: $input) {
            draft {
              id
              status
              customer {
                id
                firstName
                lastName
              }
              currencyCode
              nextBillingDate
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        customerId,
        currencyCode,
        nextBillingDate,
        contract: {},
      };

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

  // Create Subscription Contract Atomic
  server.registerTool(
    "create_subscription_contract_atomic",
    {
      description: "Create a complete subscription contract in a single operation",
      inputSchema: {
        customerId: z.string().describe("Customer ID to associate with the subscription"),
        currencyCode: z.string().describe("Currency code (e.g., 'USD')"),
        nextBillingDate: z.string().describe("Next billing date (ISO 8601 format)"),
        lineItems: z.array(z.object({
          productVariantId: z.string().describe("Product variant ID"),
          quantity: z.number().describe("Quantity"),
          currentPrice: z.number().describe("Price per unit"),
        })).describe("Line items for the subscription"),
        billingInterval: z.enum(["DAY", "WEEK", "MONTH", "YEAR"]).describe("Billing interval"),
        billingIntervalCount: z.number().describe("Number of intervals between billings"),
        deliveryInterval: z.enum(["DAY", "WEEK", "MONTH", "YEAR"]).describe("Delivery interval"),
        deliveryIntervalCount: z.number().describe("Number of intervals between deliveries"),
        deliveryPrice: z.number().optional().describe("Delivery price"),
      },
    },
    async ({ customerId, currencyCode, nextBillingDate, lineItems, billingInterval, billingIntervalCount, deliveryInterval, deliveryIntervalCount, deliveryPrice = 0 }) => {
      const mutation = `
        mutation SubscriptionContractAtomicCreate($input: SubscriptionContractAtomicCreateInput!) {
          subscriptionContractAtomicCreate(input: $input) {
            contract {
              id
              status
              customer {
                id
                firstName
                lastName
              }
              currencyCode
              nextBillingDate
              lines(first: 50) {
                edges {
                  node {
                    id
                    title
                    quantity
                    currentPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
              billingPolicy {
                interval
                intervalCount
              }
              deliveryPolicy {
                interval
                intervalCount
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        customerId,
        currencyCode,
        nextBillingDate,
        lines: lineItems.map(item => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          currentPrice: item.currentPrice.toString(),
        })),
        billingPolicy: {
          interval: billingInterval,
          intervalCount: billingIntervalCount,
        },
        deliveryPolicy: {
          interval: deliveryInterval,
          intervalCount: deliveryIntervalCount,
        },
        deliveryPrice: deliveryPrice.toString(),
      };

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

  // Cancel Subscription Contract
  server.registerTool(
    "cancel_subscription_contract",
    {
      description: "Cancel a subscription contract",
      inputSchema: {
        subscriptionContractId: z.string().describe("Subscription Contract ID to cancel"),
      },
    },
    async ({ subscriptionContractId }) => {
      const mutation = `
        mutation SubscriptionContractCancel($subscriptionContractId: ID!) {
          subscriptionContractCancel(subscriptionContractId: $subscriptionContractId) {
            contract {
              id
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

      try {
        const result = await client.execute(mutation, { subscriptionContractId });
        
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

  // Pause Subscription Contract
  server.registerTool(
    "pause_subscription_contract",
    {
      description: "Pause a subscription contract",
      inputSchema: {
        subscriptionContractId: z.string().describe("Subscription Contract ID to pause"),
      },
    },
    async ({ subscriptionContractId }) => {
      const mutation = `
        mutation SubscriptionContractPause($subscriptionContractId: ID!) {
          subscriptionContractPause(subscriptionContractId: $subscriptionContractId) {
            contract {
              id
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

      try {
        const result = await client.execute(mutation, { subscriptionContractId });
        
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

  // Activate Subscription Contract
  server.registerTool(
    "activate_subscription_contract",
    {
      description: "Activate a subscription contract (must be active, paused, or failed status)",
      inputSchema: {
        subscriptionContractId: z.string().describe("Subscription Contract ID to activate"),
      },
    },
    async ({ subscriptionContractId }) => {
      const mutation = `
        mutation SubscriptionContractActivate($subscriptionContractId: ID!) {
          subscriptionContractActivate(subscriptionContractId: $subscriptionContractId) {
            contract {
              id
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

      try {
        const result = await client.execute(mutation, { subscriptionContractId });
        
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

  // Set Next Billing Date
  server.registerTool(
    "set_subscription_contract_next_billing_date",
    {
      description: "Set the next billing date for a subscription contract",
      inputSchema: {
        contractId: z.string().describe("Subscription Contract ID"),
        date: z.string().describe("Next billing date (ISO 8601 format)"),
      },
    },
    async ({ contractId, date }) => {
      const mutation = `
        mutation SubscriptionContractSetNextBillingDate($contractId: ID!, $date: DateTime!) {
          subscriptionContractSetNextBillingDate(contractId: $contractId, date: $date) {
            contract {
              id
              nextBillingDate
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { contractId, date });
        
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

  // Expire Subscription Contract
  server.registerTool(
    "expire_subscription_contract",
    {
      description: "Expire a subscription contract",
      inputSchema: {
        subscriptionContractId: z.string().describe("Subscription Contract ID to expire"),
      },
    },
    async ({ subscriptionContractId }) => {
      const mutation = `
        mutation SubscriptionContractExpire($subscriptionContractId: ID!) {
          subscriptionContractExpire(subscriptionContractId: $subscriptionContractId) {
            contract {
              id
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

      try {
        const result = await client.execute(mutation, { subscriptionContractId });
        
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

  // Fail Subscription Contract
  server.registerTool(
    "fail_subscription_contract",
    {
      description: "Mark a subscription contract as failed",
      inputSchema: {
        subscriptionContractId: z.string().describe("Subscription Contract ID to mark as failed"),
      },
    },
    async ({ subscriptionContractId }) => {
      const mutation = `
        mutation SubscriptionContractFail($subscriptionContractId: ID!) {
          subscriptionContractFail(subscriptionContractId: $subscriptionContractId) {
            contract {
              id
              status
              updatedAt
              lastPaymentStatus
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { subscriptionContractId });
        
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

  // Update Subscription Contract Product
  server.registerTool(
    "update_subscription_contract_product",
    {
      description: "Change a product or product price in a subscription contract",
      inputSchema: {
        subscriptionContractId: z.string().describe("Subscription Contract ID"),
        lineId: z.string().describe("Subscription Line ID to update"),
        productVariantId: z.string().optional().describe("New product variant ID (optional)"),
        currentPrice: z.number().optional().describe("New current price (optional)"),
      },
    },
    async ({ subscriptionContractId, lineId, productVariantId, currentPrice }) => {
      const mutation = `
        mutation SubscriptionContractProductChange($subscriptionContractId: ID!, $lineId: ID!, $input: SubscriptionContractProductChangeInput!) {
          subscriptionContractProductChange(subscriptionContractId: $subscriptionContractId, lineId: $lineId, input: $input) {
            contract {
              id
              lines(first: 50) {
                edges {
                  node {
                    id
                    productId
                    variantId
                    title
                    quantity
                    currentPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
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
      if (productVariantId) input.productVariantId = productVariantId;
      if (currentPrice !== undefined) input.currentPrice = currentPrice.toString();

      try {
        const result = await client.execute(mutation, { subscriptionContractId, lineId, input });
        
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
