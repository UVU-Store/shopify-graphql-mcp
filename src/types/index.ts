export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}

export interface GraphQLError {
  message: string;
  extensions?: Record<string, unknown>;
}

export interface ShopifyConfig {
  accessToken: string;
  storeUrl: string;
  apiUrl: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  scope: string;
  category: string;
}

export interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  vendor: string;
  productType: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  totalInventory: number;
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: string;
        sku?: string;
        inventoryQuantity: number;
      };
    }>;
  };
}

export interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  state: string;
  verifiedEmail: boolean;
  addresses: {
    edges: Array<{
      node: {
        id: string;
        address1: string;
        city: string;
        province?: string;
        country: string;
        zip: string;
      };
    }>;
  };
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  productsCount: number;
  sortOrder: string;
  updatedAt: string;
}
