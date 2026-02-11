import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerCompanyTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Companies
  server.registerTool(
    "get_companies",
    {
      description: "Fetch B2B companies from the store",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of companies to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'name:Acme')"),
        sortKey: z.enum(["NAME", "CREATED_AT", "UPDATED_AT", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "NAME", reverse = false }) => {
      const graphqlQuery = `
        query GetCompanies($first: Int!, $after: String, $query: String, $sortKey: CompanySortKeys, $reverse: Boolean) {
          companies(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                name
                externalId
                note
                createdAt
                updatedAt
                defaultCursor
                contactRoles(first: 10) {
                  edges {
                    node {
                      id
                      name
                    }
                  }
                }
                contacts(first: 10) {
                  edges {
                    node {
                      id
                      firstName
                      lastName
                      email
                      phone
                      isMainContact
                    }
                  }
                }
                locations(first: 10) {
                  edges {
                    node {
                      id
                      name
                      externalId
                      phone
                      locale
                      billingAddress {
                        address1
                        city
                        province
                        country
                        zip
                      }
                      shippingAddress {
                        address1
                        city
                        province
                        country
                        zip
                      }
                    }
                  }
                }
                orders(first: 5) {
                  edges {
                    node {
                      id
                      name
                      createdAt
                      totalPriceSet {
                        shopMoney {
                          amount
                          currencyCode
                        }
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

  // Get Company
  server.registerTool(
    "get_company",
    {
      description: "Fetch a specific B2B company by ID",
      inputSchema: {
        id: z.string().describe("Company ID (e.g., 'gid://shopify/Company/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetCompany($id: ID!) {
          company(id: $id) {
            id
            name
            externalId
            note
            createdAt
            updatedAt
            defaultCursor
            contactRoles(first: 20) {
              edges {
                node {
                  id
                  name
                }
              }
            }
            contacts(first: 50) {
              edges {
                node {
                  id
                  firstName
                  lastName
                  email
                  phone
                  isMainContact
                  locale
                  customer {
                    id
                    email
                  }
                }
              }
            }
            locations(first: 50) {
              edges {
                node {
                  id
                  name
                  externalId
                  phone
                  locale
                  billingAddress {
                    address1
                    address2
                    city
                    province
                    country
                    zip
                    phone
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
                  taxExemptions
                  taxRegistrationId
                }
              }
            }
            orders(first: 20) {
              edges {
                node {
                  id
                  name
                  createdAt
                  displayFinancialStatus
                  displayFulfillmentStatus
                  totalPriceSet {
                    shopMoney {
                      amount
                      currencyCode
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

  // Create Company
  server.registerTool(
    "create_company",
    {
      description: "Create a new B2B company",
      inputSchema: {
        name: z.string().describe("Company name"),
        externalId: z.string().optional().describe("External ID for the company"),
        note: z.string().optional().describe("Internal notes about the company"),
        mainContact: z.object({
          firstName: z.string().describe("Contact first name"),
          lastName: z.string().describe("Contact last name"),
          email: z.string().email().describe("Contact email"),
          phone: z.string().optional().describe("Contact phone"),
        }).optional().describe("Main contact person for the company"),
      },
    },
    async ({ name, externalId, note, mainContact }) => {
      const mutation = `
        mutation CompanyCreate($input: CompanyCreateInput!) {
          companyCreate(input: $input) {
            company {
              id
              name
              externalId
              note
              createdAt
              contacts(first: 10) {
                edges {
                  node {
                    id
                    firstName
                    lastName
                    email
                    isMainContact
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

      const input: Record<string, unknown> = { name };
      if (externalId) input.externalId = externalId;
      if (note) input.note = note;
      if (mainContact) input.mainContact = mainContact;

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

  // Update Company
  server.registerTool(
    "update_company",
    {
      description: "Update an existing B2B company",
      inputSchema: {
        id: z.string().describe("Company ID"),
        name: z.string().optional().describe("Company name"),
        externalId: z.string().optional().describe("External ID for the company"),
        note: z.string().optional().describe("Internal notes about the company"),
      },
    },
    async ({ id, name, externalId, note }) => {
      const mutation = `
        mutation CompanyUpdate($id: ID!, $input: CompanyUpdateInput!) {
          companyUpdate(id: $id, input: $input) {
            company {
              id
              name
              externalId
              note
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
      if (externalId !== undefined) input.externalId = externalId;
      if (note !== undefined) input.note = note;

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

  // Create Company Location
  server.registerTool(
    "create_company_location",
    {
      description: "Create a new location for a B2B company",
      inputSchema: {
        companyId: z.string().describe("Company ID"),
        name: z.string().describe("Location name"),
        externalId: z.string().optional().describe("External ID for the location"),
        phone: z.string().optional().describe("Location phone number"),
        locale: z.string().optional().describe("Location locale (e.g., 'en-US')"),
        billingAddress: z.object({
          address1: z.string().describe("Street address"),
          address2: z.string().optional().describe("Apartment, suite, etc."),
          city: z.string().describe("City"),
          province: z.string().describe("Province/State"),
          country: z.string().describe("Country"),
          zip: z.string().describe("ZIP/Postal code"),
          phone: z.string().optional().describe("Phone number"),
        }).describe("Billing address"),
        shippingAddress: z.object({
          address1: z.string().describe("Street address"),
          address2: z.string().optional().describe("Apartment, suite, etc."),
          city: z.string().describe("City"),
          province: z.string().describe("Province/State"),
          country: z.string().describe("Country"),
          zip: z.string().describe("ZIP/Postal code"),
          phone: z.string().optional().describe("Phone number"),
        }).optional().describe("Shipping address (if different from billing)"),
      },
    },
    async ({ companyId, name, externalId, phone, locale, billingAddress, shippingAddress }) => {
      const mutation = `
        mutation CompanyLocationCreate($companyId: ID!, $input: CompanyLocationInput!) {
          companyLocationCreate(companyId: $companyId, input: $input) {
            companyLocation {
              id
              name
              externalId
              phone
              locale
              billingAddress {
                address1
                city
                province
                country
                zip
              }
              shippingAddress {
                address1
                city
                province
                country
                zip
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input: Record<string, unknown> = { 
        name,
        billingAddress,
      };
      if (externalId) input.externalId = externalId;
      if (phone) input.phone = phone;
      if (locale) input.locale = locale;
      if (shippingAddress) input.shippingAddress = shippingAddress;

      try {
        const result = await client.execute(mutation, { companyId, input });
        
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
