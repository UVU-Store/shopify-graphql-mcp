import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";
import { Customer } from "../types/index.js";

export function registerCustomerTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Customers
  server.registerTool(
    "get_customers",
    {
      description: "Fetch customers from the Shopify store with optional filtering",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of customers to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'email:customer@example.com', 'name:John')"),
        sortKey: z.enum(["CREATED_AT", "UPDATED_AT", "LAST_ORDER_DATE", "TOTAL_SPENT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetCustomers($first: Int!, $after: String, $query: String, $sortKey: CustomerSortKeys, $reverse: Boolean) {
          customers(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                firstName
                lastName
                email
                phone
                createdAt
                updatedAt
                state
                verifiedEmail
                ordersCount
                totalSpentSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
                defaultAddress {
                  address1
                  city
                  province
                  country
                  zip
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
        const result = await client.execute<{ customers: { edges: Array<{ node: Customer; cursor: string }>; pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean } } }>(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Get Single Customer
  server.registerTool(
    "get_customer",
    {
      description: "Fetch a specific customer by ID",
      inputSchema: {
        id: z.string().describe("Customer ID (e.g., 'gid://shopify/Customer/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetCustomer($id: ID!) {
          customer(id: $id) {
            id
            firstName
            lastName
            email
            phone
            createdAt
            updatedAt
            state
            verifiedEmail
            ordersCount
            totalSpentSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            defaultAddress {
              id
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            addresses(first: 10) {
              edges {
                node {
                  id
                  address1
                  address2
                  city
                  province
                  country
                  zip
                  phone
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
                  totalPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            metafields(first: 10) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute<{ customer: Customer }>(graphqlQuery, { id });
        
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

  // Create Customer
  server.registerTool(
    "create_customer",
    {
      description: "Create a new customer in the Shopify store",
      inputSchema: {
        email: z.string().email().describe("Customer email"),
        firstName: z.string().optional().describe("Customer first name"),
        lastName: z.string().optional().describe("Customer last name"),
        phone: z.string().optional().describe("Customer phone"),
        acceptsMarketing: z.boolean().optional().describe("Whether customer accepts marketing"),
        addresses: z.array(z.object({
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          province: z.string().optional(),
          country: z.string(),
          zip: z.string(),
          phone: z.string().optional(),
        })).optional().describe("Customer addresses"),
      },
    },
    async ({ email, firstName, lastName, phone, acceptsMarketing, addresses }) => {
      const mutation = `
        mutation CustomerCreate($input: CustomerInput!) {
          customerCreate(input: $input) {
            customer {
              id
              firstName
              lastName
              email
              phone
              createdAt
              state
              verifiedEmail
              acceptsMarketing
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { email };
      if (firstName) input.firstName = firstName;
      if (lastName) input.lastName = lastName;
      if (phone) input.phone = phone;
      if (acceptsMarketing !== undefined) input.acceptsMarketing = acceptsMarketing;
      if (addresses) input.addresses = addresses;

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

  // Update Customer
  server.registerTool(
    "update_customer",
    {
      description: "Update an existing customer",
      inputSchema: {
        id: z.string().describe("Customer ID (e.g., 'gid://shopify/Customer/123456789')"),
        email: z.string().email().optional().describe("Customer email"),
        firstName: z.string().optional().describe("Customer first name"),
        lastName: z.string().optional().describe("Customer last name"),
        phone: z.string().optional().describe("Customer phone"),
        acceptsMarketing: z.boolean().optional().describe("Whether customer accepts marketing"),
      },
    },
    async ({ id, email, firstName, lastName, phone, acceptsMarketing }) => {
      const mutation = `
        mutation CustomerUpdate($input: CustomerInput!) {
          customerUpdate(input: $input) {
            customer {
              id
              firstName
              lastName
              email
              phone
              updatedAt
              acceptsMarketing
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { id };
      if (email) input.email = email;
      if (firstName) input.firstName = firstName;
      if (lastName) input.lastName = lastName;
      if (phone) input.phone = phone;
      if (acceptsMarketing !== undefined) input.acceptsMarketing = acceptsMarketing;

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

  // Delete Customer
  server.registerTool(
    "delete_customer",
    {
      description: "Delete a customer from the store",
      inputSchema: {
        id: z.string().describe("Customer ID (e.g., 'gid://shopify/Customer/123456789')"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation CustomerDelete($input: CustomerDeleteInput!) {
          customerDelete(input: $input) {
            deletedCustomerId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { input: { id } });
        
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

  // Create Customer Address
  server.registerTool(
    "create_customer_address",
    {
      description: "Create a new address for a customer",
      inputSchema: {
        customerId: z.string().describe("Customer ID"),
        address: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          province: z.string().optional(),
          provinceCode: z.string().optional(),
          country: z.string().optional(),
          countryCode: z.string().optional(),
          zip: z.string(),
          phone: z.string().optional(),
        }).describe("Address to create"),
        setAsDefault: z.boolean().optional().describe("Set as default address"),
      },
    },
    async ({ customerId, address, setAsDefault }) => {
      const mutation = `
        mutation CustomerAddressCreate($customerId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) {
          customerAddressCreate(customerId: $customerId, address: $address, setAsDefault: $setAsDefault) {
            customerAddress {
              id
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { customerId, address, setAsDefault });

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

  // Update Customer Address
  server.registerTool(
    "update_customer_address",
    {
      description: "Update a customer's existing address",
      inputSchema: {
        customerId: z.string().describe("Customer ID"),
        addressId: z.string().describe("Address ID to update"),
        address: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          address1: z.string(),
          address2: z.string().optional(),
          city: z.string(),
          province: z.string().optional(),
          provinceCode: z.string().optional(),
          country: z.string().optional(),
          countryCode: z.string().optional(),
          zip: z.string(),
          phone: z.string().optional(),
        }).describe("Updated address data"),
        setAsDefault: z.boolean().optional().describe("Set as default address"),
      },
    },
    async ({ customerId, addressId, address, setAsDefault }) => {
      const mutation = `
        mutation CustomerAddressUpdate($customerId: ID!, $addressId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) {
          customerAddressUpdate(customerId: $customerId, addressId: $addressId, address: $address, setAsDefault: $setAsDefault) {
            customerAddress {
              id
              address1
              address2
              city
              province
              country
              zip
              phone
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { customerId, addressId, address, setAsDefault });

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

  // Delete Customer Address
  server.registerTool(
    "delete_customer_address",
    {
      description: "Delete a customer's address",
      inputSchema: {
        customerId: z.string().describe("Customer ID"),
        addressId: z.string().describe("Address ID to delete"),
      },
    },
    async ({ customerId, addressId }) => {
      const mutation = `
        mutation CustomerAddressDelete($customerId: ID!, $addressId: ID!) {
          customerAddressDelete(customerId: $customerId, addressId: $addressId) {
            deletedCustomerAddressId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { customerId, addressId });

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
