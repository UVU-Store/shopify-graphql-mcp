import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCheckoutTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Checkouts
  server.registerTool(
    "get_checkouts",
    {
      description: "Fetch abandoned or active checkouts from the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of checkouts to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'abandoned:true', 'email:customer@example.com')"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetCheckouts($first: Int!, $after: String, $query: String, $sortKey: CheckoutSortKeys, $reverse: Boolean) {
          checkouts(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                createdAt
                updatedAt
                completedAt
                email
                phone
                subtotalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                lineItems(first: 20) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      variant {
                        id
                        title
                        sku
                        product {
                          id
                          title
                        }
                      }
                    }
                  }
                }
                shippingAddress {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                  phone
                }
                billingAddress {
                  address1
                  address2
                  city
                  province
                  country
                  zip
                  phone
                }
                customer {
                  id
                  firstName
                  lastName
                  email
                }
                abandonedCheckoutUrl
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

  // Get Checkout
  server.registerTool(
    "get_checkout",
    {
      description: "Fetch a specific checkout by ID",
      inputSchema: {
        id: z.string().describe("Checkout ID (e.g., 'gid://shopify/Checkout/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetCheckout($id: ID!) {
          checkout(id: $id) {
            id
            createdAt
            updatedAt
            completedAt
            email
            phone
            subtotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalTaxSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPrice
                  variant {
                    id
                    title
                    sku
                    product {
                      id
                      title
                    }
                  }
                }
              }
            }
            shippingAddress {
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            billingAddress {
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            customer {
              id
              firstName
              lastName
              email
            }
            abandonedCheckoutUrl
            appliedGiftCards {
              id
              amountUsedSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              balanceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
            discountApplications(first: 10) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                    value {
                      ... on MoneyV2 {
                        amount
                        currencyCode
                      }
                      ... on PricingPercentageValue {
                        percentage
                      }
                    }
                  }
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

  // Get Checkout Branding Settings
  server.registerTool(
    "get_checkout_branding_settings",
    {
      description: "Fetch checkout branding settings for the store",
      inputSchema: {},
    },
    async () => {
      const query = `
        query GetCheckoutBranding {
          checkoutBranding {
            customizations {
              colors {
                schemes {
                  default {
                    base {
                      text
                      background
                      accent
                    }
                  }
                }
              }
              typography {
                size {
                  base
                }
                primary {
                  name
                }
                secondary {
                  name
                }
              }
              control {
                border {
                  width
                  color
                  radius
                }
              }
              favicon {
                image {
                  url
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, {});
        
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

  // Update Checkout Branding Settings
  server.registerTool(
    "update_checkout_branding_settings",
    {
      description: "Update checkout branding settings",
      inputSchema: {
        primaryColor: z.string().optional().describe("Primary brand color (hex code)"),
        secondaryColor: z.string().optional().describe("Secondary brand color (hex code)"),
        accentColor: z.string().optional().describe("Accent color for buttons/links (hex code)"),
        backgroundColor: z.string().optional().describe("Background color (hex code)"),
        textColor: z.string().optional().describe("Text color (hex code)"),
        fontFamily: z.string().optional().describe("Font family name"),
        borderRadius: z.enum(["NONE", "SMALL", "BASE", "LARGE"]).optional().describe("Border radius for controls"),
        faviconUrl: z.string().optional().describe("URL to favicon image"),
      },
    },
    async ({ primaryColor, secondaryColor, accentColor, backgroundColor, textColor, fontFamily, borderRadius, faviconUrl }) => {
      const mutation = `
        mutation CheckoutBrandingUpsert($checkoutBrandingInput: CheckoutBrandingInput!) {
          checkoutBrandingUpsert(checkoutBrandingInput: $checkoutBrandingInput) {
            checkoutBranding {
              customizations {
                colors {
                  schemes {
                    default {
                      base {
                        text
                        background
                        accent
                      }
                    }
                  }
                }
                typography {
                  primary {
                    name
                  }
                }
                control {
                  border {
                    radius
                  }
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

      const input: any = {};
      
      if (primaryColor || secondaryColor || accentColor || backgroundColor || textColor) {
        input.colors = {
          schemes: {
            default: {
              base: {} as any
            }
          }
        };
        if (textColor) input.colors.schemes.default.base.text = textColor;
        if (backgroundColor) input.colors.schemes.default.base.background = backgroundColor;
        if (accentColor) input.colors.schemes.default.base.accent = accentColor;
      }

      if (fontFamily) {
        input.typography = {
          primary: {
            name: fontFamily
          }
        };
      }

      if (borderRadius) {
        input.control = {
          border: {
            radius: borderRadius
          }
        };
      }

      if (faviconUrl) {
        input.favicon = {
          image: {
            url: faviconUrl
          }
        };
      }

      try {
        const result = await client.execute(mutation, { checkoutBrandingInput: input });
        
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

  // Complete Checkout
  server.registerTool(
    "complete_checkout",
    {
      description: "Convert an abandoned checkout to a draft order (for recovery)",
      inputSchema: {
        checkoutId: z.string().describe("Checkout ID to complete"),
      },
    },
    async ({ checkoutId }) => {
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify({
            note: "Checkouts cannot be directly 'completed' through the Admin API. To recover an abandoned checkout, you should:",
            steps: [
              "1. Get the checkout details using get_checkout",
              "2. Create a draft order using create_draft_order with the checkout's line items",
              "3. Send a recovery email to the customer with the draft order link",
              "4. Or use Shopify's native abandoned checkout recovery email settings"
            ],
            checkoutId: checkoutId,
            recommendation: "Use Shopify's built-in abandoned checkout recovery feature in Settings > Notifications > Abandoned checkouts"
          }, null, 2) 
        }],
      };
    }
  );
}
