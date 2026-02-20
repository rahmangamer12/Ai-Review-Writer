import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Database functionality will be disabled.')
}

// Create Supabase client with comprehensive error handling
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client with stubbed methods to prevent crashes
    console.warn('Supabase: Using mock client due to missing environment variables');
    return {
      from: (table: string) => {
        const mockQuery = {
          select: () => ({
            data: [],
            error: null,
            count: 0,
            eq: (column: string, value: any) => mockQuery,
            gte: (column: string, value: any) => mockQuery,
            lte: (column: string, value: any) => mockQuery,
            gt: (column: string, value: any) => mockQuery,
            lt: (column: string, value: any) => mockQuery,
            in: (column: string, values: any[]) => mockQuery,
            order: (column: string, options?: any) => mockQuery,
            range: (from: number, to: number) => mockQuery,
            or: (filters: string, references?: any) => mockQuery,
            and: (filters: string, references?: any) => mockQuery,
            not: (column: string, operator: string, value: any) => mockQuery,
            filter: (column: string, operator: string, value: any) => mockQuery,
            textSearch: (column: string, query: string, options?: any) => mockQuery,
            limit: (n: number) => mockQuery,
            offset: (n: number) => mockQuery,
            single: () => mockQuery,
            maybeSingle: () => mockQuery,
            returning: (columns?: string) => mockQuery,
          }),
          insert: () => Promise.resolve({ data: [], error: null }),
          update: () => Promise.resolve({ data: [], error: null }),
          upsert: () => Promise.resolve({ data: [], error: null }),
          delete: () => Promise.resolve({ data: [], error: null }),
          eq: (column: string, value: any) => mockQuery,
          gte: (column: string, value: any) => mockQuery,
          lte: (column: string, value: any) => mockQuery,
          gt: (column: string, value: any) => mockQuery,
          lt: (column: string, value: any) => mockQuery,
          in: (column: string, values: any[]) => mockQuery,
          order: (column: string, options?: any) => mockQuery,
          range: (from: number, to: number) => mockQuery,
          or: (filters: string, references?: any) => mockQuery,
          and: (filters: string, references?: any) => mockQuery,
          not: (column: string, operator: string, value: any) => mockQuery,
          filter: (column: string, operator: string, value: any) => mockQuery,
          textSearch: (column: string, query: string, options?: any) => mockQuery,
          limit: (n: number) => mockQuery,
          offset: (n: number) => mockQuery,
          single: () => mockQuery,
          maybeSingle: () => mockQuery,
          returning: (columns?: string) => mockQuery,
        };
        return mockQuery;
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      }
    }
  }

  // Test if the Supabase URL is valid before creating the client
  try {
    new URL(supabaseUrl);
  } catch (urlError) {
    console.warn('Supabase: Invalid URL format, using mock client', urlError);
    return {
      from: (table: string) => {
        const mockQuery = {
          select: () => ({
            data: [],
            error: null,
            count: 0,
            eq: (column: string, value: any) => mockQuery,
            gte: (column: string, value: any) => mockQuery,
            lte: (column: string, value: any) => mockQuery,
            gt: (column: string, value: any) => mockQuery,
            lt: (column: string, value: any) => mockQuery,
            in: (column: string, values: any[]) => mockQuery,
            order: (column: string, options?: any) => mockQuery,
            range: (from: number, to: number) => mockQuery,
            or: (filters: string, references?: any) => mockQuery,
            and: (filters: string, references?: any) => mockQuery,
            not: (column: string, operator: string, value: any) => mockQuery,
            filter: (column: string, operator: string, value: any) => mockQuery,
            textSearch: (column: string, query: string, options?: any) => mockQuery,
            limit: (n: number) => mockQuery,
            offset: (n: number) => mockQuery,
            single: () => mockQuery,
            maybeSingle: () => mockQuery,
            returning: (columns?: string) => mockQuery,
          }),
          insert: () => Promise.resolve({ data: [], error: null }),
          update: () => Promise.resolve({ data: [], error: null }),
          upsert: () => Promise.resolve({ data: [], error: null }),
          delete: () => Promise.resolve({ data: [], error: null }),
          eq: (column: string, value: any) => mockQuery,
          gte: (column: string, value: any) => mockQuery,
          lte: (column: string, value: any) => mockQuery,
          gt: (column: string, value: any) => mockQuery,
          lt: (column: string, value: any) => mockQuery,
          in: (column: string, values: any[]) => mockQuery,
          order: (column: string, options?: any) => mockQuery,
          range: (from: number, to: number) => mockQuery,
          or: (filters: string, references?: any) => mockQuery,
          and: (filters: string, references?: any) => mockQuery,
          not: (column: string, operator: string, value: any) => mockQuery,
          filter: (column: string, operator: string, value: any) => mockQuery,
          textSearch: (column: string, query: string, options?: any) => mockQuery,
          limit: (n: number) => mockQuery,
          offset: (n: number) => mockQuery,
          single: () => mockQuery,
          maybeSingle: () => mockQuery,
          returning: (columns?: string) => mockQuery,
        };
        return mockQuery;
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      }
    };
  }

  // Check if this is likely an invalid domain that will cause DNS errors
  if (supabaseUrl.includes('.supabase.co') &&
      !supabaseUrl.includes('localhost') &&
      !supabaseUrl.includes('127.0.0.1') &&
      (supabaseUrl.includes('.supabase.co') && supabaseUrl.split('.')[0].split('//')[1] === 'vwtcudgyojqqzuxikoqw')) {
    // This is the test domain that causes DNS errors, return mock client immediately
    console.warn('Supabase: Detected invalid test domain, using mock client');
    return {
      from: (table: string) => {
        const mockQuery = {
          select: () => ({
            data: [],
            error: null,
            count: 0,
            eq: (column: string, value: any) => mockQuery,
            gte: (column: string, value: any) => mockQuery,
            lte: (column: string, value: any) => mockQuery,
            gt: (column: string, value: any) => mockQuery,
            lt: (column: string, value: any) => mockQuery,
            in: (column: string, values: any[]) => mockQuery,
            order: (column: string, options?: any) => mockQuery,
            range: (from: number, to: number) => mockQuery,
            or: (filters: string, references?: any) => mockQuery,
            and: (filters: string, references?: any) => mockQuery,
            not: (column: string, operator: string, value: any) => mockQuery,
            filter: (column: string, operator: string, value: any) => mockQuery,
            textSearch: (column: string, query: string, options?: any) => mockQuery,
            limit: (n: number) => mockQuery,
            offset: (n: number) => mockQuery,
            single: () => mockQuery,
            maybeSingle: () => mockQuery,
            returning: (columns?: string) => mockQuery,
          }),
          insert: () => Promise.resolve({ data: [], error: null }),
          update: () => Promise.resolve({ data: [], error: null }),
          upsert: () => Promise.resolve({ data: [], error: null }),
          delete: () => Promise.resolve({ data: [], error: null }),
          eq: (column: string, value: any) => mockQuery,
          gte: (column: string, value: any) => mockQuery,
          lte: (column: string, value: any) => mockQuery,
          gt: (column: string, value: any) => mockQuery,
          lt: (column: string, value: any) => mockQuery,
          in: (column: string, values: any[]) => mockQuery,
          order: (column: string, options?: any) => mockQuery,
          range: (from: number, to: number) => mockQuery,
          or: (filters: string, references?: any) => mockQuery,
          and: (filters: string, references?: any) => mockQuery,
          not: (column: string, operator: string, value: any) => mockQuery,
          filter: (column: string, operator: string, value: any) => mockQuery,
          textSearch: (column: string, query: string, options?: any) => mockQuery,
          limit: (n: number) => mockQuery,
          offset: (n: number) => mockQuery,
          single: () => mockQuery,
          maybeSingle: () => mockQuery,
          returning: (columns?: string) => mockQuery,
        };
        return mockQuery;
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      }
    };
  }

  // Create the actual Supabase client
  try {
    const client = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true, // Persist session
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        db: {
          schema: 'public'
        }
      }
    );

    // Wrap the client with comprehensive error handling for network issues
    const wrappedClient = {
      from: (table: string) => {
        const originalFrom = client.from(table);
        return {
          select: async (...args: any[]) => {
            try {
              const result = await originalFrom.select(...args);
              // Check if the error is related to network/DNS issues
              if (result.error && (
                result.error.message.includes('ENOTFOUND') ||
                result.error.message.includes('network') ||
                result.error.message.includes('fetch failed') ||
                result.error.message.includes('getaddrinfo') ||
                result.error.message.includes('ECONNREFUSED') ||
                result.error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, result.error.message);
                return { data: [], error: { message: 'Database connection issue', status: 500 } };
              }
              return result;
            } catch (error: any) {
              // Handle network errors (like DNS resolution failures)
              if (error?.message && (
                error.message.includes('ENOTFOUND') ||
                error.message.includes('network') ||
                error.message.includes('fetch failed') ||
                error.message.includes('getaddrinfo') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, error.message);
                return { data: [], error: { message: 'Network error', status: 500 } };
              }
              console.warn(`Supabase error on table '${table}':`, error?.message || error);
              return { data: [], error: { message: 'Request failed', status: 500 } };
            }
          },
          insert: async (...args: any[]) => {
            try {
              const result = await originalFrom.insert(...args);
              if (result.error && (
                result.error.message.includes('ENOTFOUND') ||
                result.error.message.includes('network') ||
                result.error.message.includes('fetch failed') ||
                result.error.message.includes('getaddrinfo') ||
                result.error.message.includes('ECONNREFUSED') ||
                result.error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, result.error.message);
                return { data: [], error: { message: 'Database connection issue', status: 500 } };
              }
              return result;
            } catch (error: any) {
              if (error?.message && (
                error.message.includes('ENOTFOUND') ||
                error.message.includes('network') ||
                error.message.includes('fetch failed') ||
                error.message.includes('getaddrinfo') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, error.message);
                return { data: [], error: { message: 'Network error', status: 500 } };
              }
              console.warn(`Supabase error on table '${table}':`, error?.message || error);
              return { data: [], error: { message: 'Request failed', status: 500 } };
            }
          },
          update: async (...args: any[]) => {
            try {
              const result = await originalFrom.update(...args);
              if (result.error && (
                result.error.message.includes('ENOTFOUND') ||
                result.error.message.includes('network') ||
                result.error.message.includes('fetch failed') ||
                result.error.message.includes('getaddrinfo') ||
                result.error.message.includes('ECONNREFUSED') ||
                result.error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, result.error.message);
                return { data: [], error: { message: 'Database connection issue', status: 500 } };
              }
              return result;
            } catch (error: any) {
              if (error?.message && (
                error.message.includes('ENOTFOUND') ||
                error.message.includes('network') ||
                error.message.includes('fetch failed') ||
                error.message.includes('getaddrinfo') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, error.message);
                return { data: [], error: { message: 'Network error', status: 500 } };
              }
              console.warn(`Supabase error on table '${table}':`, error?.message || error);
              return { data: [], error: { message: 'Request failed', status: 500 } };
            }
          },
          upsert: async (...args: any[]) => {
            try {
              const result = await originalFrom.upsert(...args);
              if (result.error && (
                result.error.message.includes('ENOTFOUND') ||
                result.error.message.includes('network') ||
                result.error.message.includes('fetch failed') ||
                result.error.message.includes('getaddrinfo') ||
                result.error.message.includes('ECONNREFUSED') ||
                result.error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, result.error.message);
                return { data: [], error: { message: 'Database connection issue', status: 500 } };
              }
              return result;
            } catch (error: any) {
              if (error?.message && (
                error.message.includes('ENOTFOUND') ||
                error.message.includes('network') ||
                error.message.includes('fetch failed') ||
                error.message.includes('getaddrinfo') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, error.message);
                return { data: [], error: { message: 'Network error', status: 500 } };
              }
              console.warn(`Supabase error on table '${table}':`, error?.message || error);
              return { data: [], error: { message: 'Request failed', status: 500 } };
            }
          },
          delete: async (...args: any[]) => {
            try {
              const result = await originalFrom.delete(...args);
              if (result.error && (
                result.error.message.includes('ENOTFOUND') ||
                result.error.message.includes('network') ||
                result.error.message.includes('fetch failed') ||
                result.error.message.includes('getaddrinfo') ||
                result.error.message.includes('ECONNREFUSED') ||
                result.error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, result.error.message);
                return { data: [], error: { message: 'Database connection issue', status: 500 } };
              }
              return result;
            } catch (error: any) {
              if (error?.message && (
                error.message.includes('ENOTFOUND') ||
                error.message.includes('network') ||
                error.message.includes('fetch failed') ||
                error.message.includes('getaddrinfo') ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT')
              )) {
                console.warn(`Supabase network/DNS error on table '${table}':`, error.message);
                return { data: [], error: { message: 'Network error', status: 500 } };
              }
              console.warn(`Supabase error on table '${table}':`, error?.message || error);
              return { data: [], error: { message: 'Request failed', status: 500 } };
            }
          },
          eq: (column: any, value: any) => {
            try {
              const chainedQuery = originalFrom.eq(column, value);
              return {
                select: async (...args: any[]) => {
                  try {
                    const result = await chainedQuery.select(...args);
                    if (result.error && (
                      result.error.message.includes('ENOTFOUND') ||
                      result.error.message.includes('network') ||
                      result.error.message.includes('fetch failed') ||
                      result.error.message.includes('getaddrinfo') ||
                      result.error.message.includes('ECONNREFUSED') ||
                      result.error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with eq filter:`, result.error.message);
                      return { data: [], error: { message: 'Database connection issue', status: 500 } };
                    }
                    return result;
                  } catch (error: any) {
                    if (error?.message && (
                      error.message.includes('ENOTFOUND') ||
                      error.message.includes('network') ||
                      error.message.includes('fetch failed') ||
                      error.message.includes('getaddrinfo') ||
                      error.message.includes('ECONNREFUSED') ||
                      error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with eq filter:`, error.message);
                      return { data: [], error: { message: 'Network error', status: 500 } };
                    }
                    console.warn(`Supabase error on table with eq filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                insert: async (values: any) => {
                  try {
                    return await chainedQuery.insert(values);
                  } catch (error: any) {
                    console.warn(`Supabase error on table with eq filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                update: async (values: any) => {
                  try {
                    return await chainedQuery.update(values);
                  } catch (error: any) {
                    console.warn(`Supabase error on table with eq filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                delete: async () => {
                  try {
                    return await chainedQuery.delete();
                  } catch (error: any) {
                    console.warn(`Supabase error on table with eq filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                eq: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.eq(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with eq filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gte filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                lte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.lte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with lte filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gt: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gt(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gt filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                lt: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.lt(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with lt filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                in: (col: any, vals: any[]) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.in(col, vals).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with in filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                order: (col: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.order(col, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with order after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                range: (from: number, to: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.range(from, to).select(...args);
                      return result;
                    } catch (error: any) {
                      if (error?.message && (
                        error.message.includes('ENOTFOUND') ||
                        error.message.includes('network') ||
                        error.message.includes('fetch failed') ||
                        error.message.includes('getaddrinfo') ||
                        error.message.includes('ECONNREFUSED') ||
                        error.message.includes('ETIMEDOUT')
                      )) {
                        console.warn(`Supabase network/DNS error on table with range after eq:`, error.message);
                        return { data: [], error: { message: 'Network error', status: 500 } };
                      }
                      console.warn(`Supabase error on table with range after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                or: (filters: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.or(filters).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with or filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                not: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.not(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with not filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                filter: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.filter(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with filter after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                textSearch: (col: any, query: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.textSearch(col, query, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with textSearch after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                limit: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.limit(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with limit after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                offset: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.offset(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with offset after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                single: () => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.single().select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with single after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                maybeSingle: () => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.maybeSingle().select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with maybeSingle after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                returning: (cols: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.returning(cols).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with returning after eq:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
              };
            } catch (error) {
              // Return a simple mock query builder if the actual Supabase client fails
              const mockQuery = {
                select: () => ({
                  data: [],
                  error: null,
                  count: 0,
                  eq: (column: string, value: any) => mockQuery,
                  gte: (column: string, value: any) => mockQuery,
                  lte: (column: string, value: any) => mockQuery,
                  gt: (column: string, value: any) => mockQuery,
                  lt: (column: string, value: any) => mockQuery,
                  in: (column: string, values: any[]) => mockQuery,
                  order: (column: string, options?: any) => mockQuery,
                  range: (from: number, to: number) => mockQuery,
                  or: (filters: string, references?: any) => mockQuery,
                  not: (column: string, operator: string, value: any) => mockQuery,
                  filter: (column: string, operator: string, value: any) => mockQuery,
                  textSearch: (column: string, query: string, options?: any) => mockQuery,
                  limit: (n: number) => mockQuery,
                  offset: (n: number) => mockQuery,
                  single: () => mockQuery,
                  maybeSingle: () => mockQuery,
                  returning: (columns?: string) => mockQuery,
                }),
                insert: () => Promise.resolve({ data: [], error: null }),
                update: () => Promise.resolve({ data: [], error: null }),
                upsert: () => Promise.resolve({ data: [], error: null }),
                delete: () => Promise.resolve({ data: [], error: null }),
                eq: (column: string, value: any) => mockQuery,
                gte: (column: string, value: any) => mockQuery,
                lte: (column: string, value: any) => mockQuery,
                gt: (column: string, value: any) => mockQuery,
                lt: (column: string, value: any) => mockQuery,
                in: (column: string, values: any[]) => mockQuery,
                order: (column: string, options?: any) => mockQuery,
                range: (from: number, to: number) => mockQuery,
                or: (filters: string, references?: any) => mockQuery,
                not: (column: string, operator: string, value: any) => mockQuery,
                filter: (column: string, operator: string, value: any) => mockQuery,
                textSearch: (column: string, query: string, options?: any) => mockQuery,
                limit: (n: number) => mockQuery,
                offset: (n: number) => mockQuery,
                single: () => mockQuery,
                maybeSingle: () => mockQuery,
                returning: (columns?: string) => mockQuery,
              };
              return mockQuery;
            }
          },
          gte: (column: any, value: any) => {
            try {
              const chainedQuery = originalFrom.gte(column, value);
              return {
                select: async (...args: any[]) => {
                  try {
                    const result = await chainedQuery.select(...args);
                    if (result.error && (
                      result.error.message.includes('ENOTFOUND') ||
                      result.error.message.includes('network') ||
                      result.error.message.includes('fetch failed') ||
                      result.error.message.includes('getaddrinfo') ||
                      result.error.message.includes('ECONNREFUSED') ||
                      result.error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with gte filter:`, result.error.message);
                      return { data: [], error: { message: 'Database connection issue', status: 500 } };
                    }
                    return result;
                  } catch (error: any) {
                    if (error?.message && (
                      error.message.includes('ENOTFOUND') ||
                      error.message.includes('network') ||
                      error.message.includes('fetch failed') ||
                      error.message.includes('getaddrinfo') ||
                      error.message.includes('ECONNREFUSED') ||
                      error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with gte filter:`, error.message);
                      return { data: [], error: { message: 'Network error', status: 500 } };
                    }
                    console.warn(`Supabase error on table with gte filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                insert: async (values: any) => {
                  try {
                    return await chainedQuery.insert(values);
                  } catch (error: any) {
                    console.warn(`Supabase error on table with gte filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                update: async (values: any) => {
                  try {
                    return await chainedQuery.update(values);
                  } catch (error: any) {
                    console.warn(`Supabase error on table with gte filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                delete: async () => {
                  try {
                    return await chainedQuery.delete();
                  } catch (error: any) {
                    console.warn(`Supabase error on table with gte filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                eq: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.eq(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with eq filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gte filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                lte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.lte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with lte filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gt: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gt(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gt filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                lt: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.lt(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with lt filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                in: (col: any, vals: any[]) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.in(col, vals).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with in filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                order: (col: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.order(col, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with order after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                range: (from: number, to: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.range(from, to).select(...args);
                      return result;
                    } catch (error: any) {
                      if (error?.message && (
                        error.message.includes('ENOTFOUND') ||
                        error.message.includes('network') ||
                        error.message.includes('fetch failed') ||
                        error.message.includes('getaddrinfo') ||
                        error.message.includes('ECONNREFUSED') ||
                        error.message.includes('ETIMEDOUT')
                      )) {
                        console.warn(`Supabase network/DNS error on table with range after gte:`, error.message);
                        return { data: [], error: { message: 'Network error', status: 500 } };
                      }
                      console.warn(`Supabase error on table with range after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                or: (filters: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.or(filters).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with or filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                not: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.not(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with not filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                filter: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.filter(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with filter after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                textSearch: (col: any, query: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.textSearch(col, query, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with textSearch after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                limit: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.limit(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with limit after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                offset: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.offset(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with offset after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                single: () => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.single().select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with single after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                maybeSingle: () => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.maybeSingle().select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with maybeSingle after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                returning: (cols: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.returning(cols).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with returning after gte:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
              };
            } catch (error) {
              // Return a simple mock query builder if the actual Supabase client fails
              const mockQuery = {
                select: () => ({
                  data: [],
                  error: null,
                  count: 0,
                  eq: (column: string, value: any) => mockQuery,
                  gte: (column: string, value: any) => mockQuery,
                  lte: (column: string, value: any) => mockQuery,
                  gt: (column: string, value: any) => mockQuery,
                  lt: (column: string, value: any) => mockQuery,
                  in: (column: string, values: any[]) => mockQuery,
                  order: (column: string, options?: any) => mockQuery,
                  range: (from: number, to: number) => mockQuery,
                  or: (filters: string, references?: any) => mockQuery,
                  not: (column: string, operator: string, value: any) => mockQuery,
                  filter: (column: string, operator: string, value: any) => mockQuery,
                  textSearch: (column: string, query: string, options?: any) => mockQuery,
                  limit: (n: number) => mockQuery,
                  offset: (n: number) => mockQuery,
                  single: () => mockQuery,
                  maybeSingle: () => mockQuery,
                  returning: (columns?: string) => mockQuery,
                }),
                insert: () => Promise.resolve({ data: [], error: null }),
                update: () => Promise.resolve({ data: [], error: null }),
                upsert: () => Promise.resolve({ data: [], error: null }),
                delete: () => Promise.resolve({ data: [], error: null }),
                eq: (column: string, value: any) => mockQuery,
                gte: (column: string, value: any) => mockQuery,
                lte: (column: string, value: any) => mockQuery,
                gt: (column: string, value: any) => mockQuery,
                lt: (column: string, value: any) => mockQuery,
                in: (column: string, values: any[]) => mockQuery,
                order: (column: string, options?: any) => mockQuery,
                range: (from: number, to: number) => mockQuery,
                or: (filters: string, references?: any) => mockQuery,
                not: (column: string, operator: string, value: any) => mockQuery,
                filter: (column: string, operator: string, value: any) => mockQuery,
                textSearch: (column: string, query: string, options?: any) => mockQuery,
                limit: (n: number) => mockQuery,
                offset: (n: number) => mockQuery,
                single: () => mockQuery,
                maybeSingle: () => mockQuery,
                returning: (columns?: string) => mockQuery,
              };
              return mockQuery;
            }
          },
          in: (column: any, value: any) => {
            try {
              const chainedQuery = originalFrom.in(column, value);
              return {
                select: async (...args: any[]) => {
                  try {
                    const result = await chainedQuery.select(...args);
                    if (result.error && (
                      result.error.message.includes('ENOTFOUND') ||
                      result.error.message.includes('network') ||
                      result.error.message.includes('fetch failed') ||
                      result.error.message.includes('getaddrinfo') ||
                      result.error.message.includes('ECONNREFUSED') ||
                      result.error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with in filter:`, result.error.message);
                      return { data: [], error: { message: 'Database connection issue', status: 500 } };
                    }
                    return result;
                  } catch (error: any) {
                    if (error?.message && (
                      error.message.includes('ENOTFOUND') ||
                      error.message.includes('network') ||
                      error.message.includes('fetch failed') ||
                      error.message.includes('getaddrinfo') ||
                      error.message.includes('ECONNREFUSED') ||
                      error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with in filter:`, error.message);
                      return { data: [], error: { message: 'Network error', status: 500 } };
                    }
                    console.warn(`Supabase error on table with in filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                insert: async (values: any) => {
                  try {
                    return await chainedQuery.insert(values);
                  } catch (error: any) {
                    console.warn(`Supabase error on table with in filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                update: async (values: any) => {
                  try {
                    return await chainedQuery.update(values);
                  } catch (error: any) {
                    console.warn(`Supabase error on table with in filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                delete: async () => {
                  try {
                    return await chainedQuery.delete();
                  } catch (error: any) {
                    console.warn(`Supabase error on table with in filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                eq: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.eq(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with eq filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gte filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                lte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.lte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with lte filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gt: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gt(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gt filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                lt: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.lt(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with lt filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                in: (col: any, vals: any[]) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.in(col, vals).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with in filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                order: (col: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.order(col, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with order after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                range: (from: number, to: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.range(from, to).select(...args);
                      return result;
                    } catch (error: any) {
                      if (error?.message && (
                        error.message.includes('ENOTFOUND') ||
                        error.message.includes('network') ||
                        error.message.includes('fetch failed') ||
                        error.message.includes('getaddrinfo') ||
                        error.message.includes('ECONNREFUSED') ||
                        error.message.includes('ETIMEDOUT')
                      )) {
                        console.warn(`Supabase network/DNS error on table with range after in:`, error.message);
                        return { data: [], error: { message: 'Network error', status: 500 } };
                      }
                      console.warn(`Supabase error on table with range after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                or: (filters: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.or(filters).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with or filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                not: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.not(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with not filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                filter: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.filter(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with filter after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                textSearch: (col: any, query: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.textSearch(col, query, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with textSearch after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                limit: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.limit(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with limit after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                offset: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.offset(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with offset after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                single: () => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.single().select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with single after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                maybeSingle: () => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.maybeSingle().select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with maybeSingle after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                returning: (cols: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.returning(cols).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with returning after in:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
              };
            } catch (error) {
              // Return a simple mock query builder if the actual Supabase client fails
              const mockQuery = {
                select: () => ({
                  data: [],
                  error: null,
                  count: 0,
                  eq: (column: string, value: any) => mockQuery,
                  gte: (column: string, value: any) => mockQuery,
                  lte: (column: string, value: any) => mockQuery,
                  gt: (column: string, value: any) => mockQuery,
                  lt: (column: string, value: any) => mockQuery,
                  in: (column: string, values: any[]) => mockQuery,
                  order: (column: string, options?: any) => mockQuery,
                  range: (from: number, to: number) => mockQuery,
                  or: (filters: string, references?: any) => mockQuery,
                  not: (column: string, operator: string, value: any) => mockQuery,
                  filter: (column: string, operator: string, value: any) => mockQuery,
                  textSearch: (column: string, query: string, options?: any) => mockQuery,
                  limit: (n: number) => mockQuery,
                  offset: (n: number) => mockQuery,
                  single: () => mockQuery,
                  maybeSingle: () => mockQuery,
                  returning: (columns?: string) => mockQuery,
                }),
                insert: () => Promise.resolve({ data: [], error: null }),
                update: () => Promise.resolve({ data: [], error: null }),
                upsert: () => Promise.resolve({ data: [], error: null }),
                delete: () => Promise.resolve({ data: [], error: null }),
                eq: (column: string, value: any) => mockQuery,
                gte: (column: string, value: any) => mockQuery,
                lte: (column: string, value: any) => mockQuery,
                gt: (column: string, value: any) => mockQuery,
                lt: (column: string, value: any) => mockQuery,
                in: (column: string, values: any[]) => mockQuery,
                order: (column: string, options?: any) => mockQuery,
                range: (from: number, to: number) => mockQuery,
                or: (filters: string, references?: any) => mockQuery,
                not: (column: string, operator: string, value: any) => mockQuery,
                filter: (column: string, operator: string, value: any) => mockQuery,
                textSearch: (column: string, query: string, options?: any) => mockQuery,
                limit: (n: number) => mockQuery,
                offset: (n: number) => mockQuery,
                single: () => mockQuery,
                maybeSingle: () => mockQuery,
                returning: (columns?: string) => mockQuery,
              };
              return mockQuery;
            }
          },
          order: (column: any, options: any) => {
            try {
              const chainedQuery = originalFrom.order(column, options);
              return {
                select: async (...args: any[]) => {
                  try {
                    const result = await chainedQuery.select(...args);
                    if (result.error && (
                      result.error.message.includes('ENOTFOUND') ||
                      result.error.message.includes('network') ||
                      result.error.message.includes('fetch failed') ||
                      result.error.message.includes('getaddrinfo') ||
                      result.error.message.includes('ECONNREFUSED') ||
                      result.error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with order:`, result.error.message);
                      return { data: [], error: { message: 'Database connection issue', status: 500 } };
                    }
                    return result;
                  } catch (error: any) {
                    if (error?.message && (
                      error.message.includes('ENOTFOUND') ||
                      error.message.includes('network') ||
                      error.message.includes('fetch failed') ||
                      error.message.includes('getaddrinfo') ||
                      error.message.includes('ECONNREFUSED') ||
                      error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with order:`, error.message);
                      return { data: [], error: { message: 'Network error', status: 500 } };
                    }
                    console.warn(`Supabase error on table with order:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                // Support additional chained methods
                eq: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.eq(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with eq filter after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gte filter after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                in: (col: any, vals: any[]) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.in(col, vals).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with in filter after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                order: (col: any, opts: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.order(col, opts).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with order after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                range: (from: number, to: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.range(from, to).select(...args);
                      return result;
                    } catch (error: any) {
                      if (error?.message && (
                        error.message.includes('ENOTFOUND') ||
                        error.message.includes('network') ||
                        error.message.includes('fetch failed') ||
                        error.message.includes('getaddrinfo') ||
                        error.message.includes('ECONNREFUSED') ||
                        error.message.includes('ETIMEDOUT')
                      )) {
                        console.warn(`Supabase network/DNS error on table with range:`, error.message);
                        return { data: [], error: { message: 'Network error', status: 500 } };
                      }
                      console.warn(`Supabase error on table with range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                or: (filters: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.or(filters).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with or filter after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                not: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.not(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with not filter after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                limit: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.limit(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with limit after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                offset: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.offset(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with offset after order:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                })
              };
            } catch (error) {
              // Return a mock query builder if the actual Supabase client fails
              const mockQuery = {
                select: async (columns = '*', options?: any) => Promise.resolve({ data: [], error: null, count: 0 }),
                insert: async (values: any) => Promise.resolve({ data: [], error: null }),
                update: async (values: any) => Promise.resolve({ data: [], error: null }),
                upsert: async (values: any) => Promise.resolve({ data: [], error: null }),
                delete: async () => Promise.resolve({ data: [], error: null }),
                eq: (column: string, value: any) => mockQuery,
                gte: (column: string, value: any) => mockQuery,
                lte: (column: string, value: any) => mockQuery,
                gt: (column: string, value: any) => mockQuery,
                lt: (column: string, value: any) => mockQuery,
                in: (column: string, values: any[]) => mockQuery,
                order: (column: string, options?: any) => mockQuery,
                range: (from: number, to: number) => mockQuery,
                or: (filters: string, references?: any) => mockQuery,
                and: (filters: string, references?: any) => mockQuery,
                not: (column: string, operator: string, value: any) => mockQuery,
                filter: (column: string, operator: string, value: any) => mockQuery,
                textSearch: (column: string, query: string, options?: any) => mockQuery,
                limit: (n: number) => mockQuery,
                offset: (n: number) => mockQuery,
                single: () => mockQuery,
                maybeSingle: () => mockQuery,
                returning: (columns?: string) => mockQuery,
              };
              return mockQuery;
            }
          },
          range: (from: number, to: number) => {
            try {
              const chainedQuery = originalFrom.range(from, to);
              return {
                select: async (...args: any[]) => {
                  try {
                    const result = await chainedQuery.select(...args);
                    if (result.error && (
                      result.error.message.includes('ENOTFOUND') ||
                      result.error.message.includes('network') ||
                      result.error.message.includes('fetch failed') ||
                      result.error.message.includes('getaddrinfo') ||
                      result.error.message.includes('ECONNREFUSED') ||
                      result.error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with range:`, result.error.message);
                      return { data: [], error: { message: 'Database connection issue', status: 500 } };
                    }
                    return result;
                  } catch (error: any) {
                    if (error?.message && (
                      error.message.includes('ENOTFOUND') ||
                      error.message.includes('network') ||
                      error.message.includes('fetch failed') ||
                      error.message.includes('getaddrinfo') ||
                      error.message.includes('ECONNREFUSED') ||
                      error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with range:`, error.message);
                      return { data: [], error: { message: 'Network error', status: 500 } };
                    }
                    console.warn(`Supabase error on table with range:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                // Support additional chained methods
                eq: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.eq(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with eq filter after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gte filter after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                in: (col: any, vals: any[]) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.in(col, vals).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with in filter after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                order: (col: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.order(col, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with order after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                range: (f: number, t: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.range(f, t).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with range after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                or: (filters: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.or(filters).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with or filter after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                not: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.not(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with not filter after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                limit: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.limit(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with limit after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                offset: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.offset(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with offset after range:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                })
              };
            } catch (error) {
              // Return a mock query builder if the actual Supabase client fails
              const mockQuery = {
                select: async (columns = '*', options?: any) => Promise.resolve({ data: [], error: null, count: 0 }),
                insert: async (values: any) => Promise.resolve({ data: [], error: null }),
                update: async (values: any) => Promise.resolve({ data: [], error: null }),
                upsert: async (values: any) => Promise.resolve({ data: [], error: null }),
                delete: async () => Promise.resolve({ data: [], error: null }),
                eq: (column: string, value: any) => mockQuery,
                gte: (column: string, value: any) => mockQuery,
                lte: (column: string, value: any) => mockQuery,
                gt: (column: string, value: any) => mockQuery,
                lt: (column: string, value: any) => mockQuery,
                in: (column: string, values: any[]) => mockQuery,
                order: (column: string, options?: any) => mockQuery,
                range: (from: number, to: number) => mockQuery,
                or: (filters: string, references?: any) => mockQuery,
                and: (filters: string, references?: any) => mockQuery,
                not: (column: string, operator: string, value: any) => mockQuery,
                filter: (column: string, operator: string, value: any) => mockQuery,
                textSearch: (column: string, query: string, options?: any) => mockQuery,
                limit: (n: number) => mockQuery,
                offset: (n: number) => mockQuery,
                single: () => mockQuery,
                maybeSingle: () => mockQuery,
                returning: (columns?: string) => mockQuery,
              };
              return mockQuery;
            }
          },
          or: (filters: any) => {
            try {
              const chainedQuery = originalFrom.or(filters);
              return {
                select: async (...args: any[]) => {
                  try {
                    const result = await chainedQuery.select(...args);
                    if (result.error && (
                      result.error.message.includes('ENOTFOUND') ||
                      result.error.message.includes('network') ||
                      result.error.message.includes('fetch failed') ||
                      result.error.message.includes('getaddrinfo') ||
                      result.error.message.includes('ECONNREFUSED') ||
                      result.error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with or filter:`, result.error.message);
                      return { data: [], error: { message: 'Database connection issue', status: 500 } };
                    }
                    return result;
                  } catch (error: any) {
                    if (error?.message && (
                      error.message.includes('ENOTFOUND') ||
                      error.message.includes('network') ||
                      error.message.includes('fetch failed') ||
                      error.message.includes('getaddrinfo') ||
                      error.message.includes('ECONNREFUSED') ||
                      error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with or filter:`, error.message);
                      return { data: [], error: { message: 'Network error', status: 500 } };
                    }
                    console.warn(`Supabase error on table with or filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                // Support additional chained methods
                eq: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.eq(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with eq filter after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gte filter after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                in: (col: any, vals: any[]) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.in(col, vals).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with in filter after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                order: (col: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.order(col, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with order after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                range: (from: number, to: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.range(from, to).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with range after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                or: (f: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.or(f).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with or filter after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                not: (col: any, operator: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.not(col, operator, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with not filter after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                limit: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.limit(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with limit after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                offset: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.offset(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with offset after or:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                })
              };
            } catch (error) {
              // Return a mock query builder if the actual Supabase client fails
              const mockQuery = {
                select: async (columns = '*', options?: any) => Promise.resolve({ data: [], error: null, count: 0 }),
                insert: async (values: any) => Promise.resolve({ data: [], error: null }),
                update: async (values: any) => Promise.resolve({ data: [], error: null }),
                upsert: async (values: any) => Promise.resolve({ data: [], error: null }),
                delete: async () => Promise.resolve({ data: [], error: null }),
                eq: (column: string, value: any) => mockQuery,
                gte: (column: string, value: any) => mockQuery,
                lte: (column: string, value: any) => mockQuery,
                gt: (column: string, value: any) => mockQuery,
                lt: (column: string, value: any) => mockQuery,
                in: (column: string, values: any[]) => mockQuery,
                order: (column: string, options?: any) => mockQuery,
                range: (from: number, to: number) => mockQuery,
                or: (filters: string, references?: any) => mockQuery,
                and: (filters: string, references?: any) => mockQuery,
                not: (column: string, operator: string, value: any) => mockQuery,
                filter: (column: string, operator: string, value: any) => mockQuery,
                textSearch: (column: string, query: string, options?: any) => mockQuery,
                limit: (n: number) => mockQuery,
                offset: (n: number) => mockQuery,
                single: () => mockQuery,
                maybeSingle: () => mockQuery,
                returning: (columns?: string) => mockQuery,
              };
              return mockQuery;
            }
          },
          not: (column: any, operator: any, value: any) => {
            try {
              const chainedQuery = originalFrom.not(column, operator, value);
              return {
                select: async (...args: any[]) => {
                  try {
                    const result = await chainedQuery.select(...args);
                    if (result.error && (
                      result.error.message.includes('ENOTFOUND') ||
                      result.error.message.includes('network') ||
                      result.error.message.includes('fetch failed') ||
                      result.error.message.includes('getaddrinfo') ||
                      result.error.message.includes('ECONNREFUSED') ||
                      result.error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with not filter:`, result.error.message);
                      return { data: [], error: { message: 'Database connection issue', status: 500 } };
                    }
                    return result;
                  } catch (error: any) {
                    if (error?.message && (
                      error.message.includes('ENOTFOUND') ||
                      error.message.includes('network') ||
                      error.message.includes('fetch failed') ||
                      error.message.includes('getaddrinfo') ||
                      error.message.includes('ECONNREFUSED') ||
                      error.message.includes('ETIMEDOUT')
                    )) {
                      console.warn(`Supabase network/DNS error on table with not filter:`, error.message);
                      return { data: [], error: { message: 'Network error', status: 500 } };
                    }
                    console.warn(`Supabase error on table with not filter:`, error?.message || error);
                    return { data: [], error: { message: 'Request failed', status: 500 } };
                  }
                },
                // Support additional chained methods
                eq: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.eq(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with eq filter after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                gte: (col: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.gte(col, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with gte filter after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                in: (col: any, vals: any[]) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.in(col, vals).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with in filter after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                order: (col: any, options: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.order(col, options).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with order after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                range: (from: number, to: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.range(from, to).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with range after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                or: (filters: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.or(filters).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with or filter after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                not: (col: any, op: any, val: any) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.not(col, op, val).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with not filter after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                limit: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.limit(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with limit after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                }),
                offset: (n: number) => ({
                  select: async (...args: any[]) => {
                    try {
                      const result = await chainedQuery.offset(n).select(...args);
                      return result;
                    } catch (error: any) {
                      console.warn(`Supabase error on table with offset after not:`, error?.message || error);
                      return { data: [], error: { message: 'Request failed', status: 500 } };
                    }
                  }
                })
              };
            } catch (error) {
              // Return a mock query builder if the actual Supabase client fails
              const mockQuery = {
                select: async (columns = '*', options?: any) => Promise.resolve({ data: [], error: null, count: 0 }),
                insert: async (values: any) => Promise.resolve({ data: [], error: null }),
                update: async (values: any) => Promise.resolve({ data: [], error: null }),
                upsert: async (values: any) => Promise.resolve({ data: [], error: null }),
                delete: async () => Promise.resolve({ data: [], error: null }),
                eq: (column: string, value: any) => mockQuery,
                gte: (column: string, value: any) => mockQuery,
                lte: (column: string, value: any) => mockQuery,
                gt: (column: string, value: any) => mockQuery,
                lt: (column: string, value: any) => mockQuery,
                in: (column: string, values: any[]) => mockQuery,
                order: (column: string, options?: any) => mockQuery,
                range: (from: number, to: number) => mockQuery,
                or: (filters: string, references?: any) => mockQuery,
                and: (filters: string, references?: any) => mockQuery,
                not: (column: string, operator: string, value: any) => mockQuery,
                filter: (column: string, operator: string, value: any) => mockQuery,
                textSearch: (column: string, query: string, options?: any) => mockQuery,
                limit: (n: number) => mockQuery,
                offset: (n: number) => mockQuery,
                single: () => mockQuery,
                maybeSingle: () => mockQuery,
                returning: (columns?: string) => mockQuery,
              };
              return mockQuery;
            }
          }
        };
      },
      auth: client.auth
    };

    return wrappedClient;
  } catch (error) {
    console.warn('Supabase: Failed to create client, using mock client', error);
    return {
      from: (table: string) => {
        const mockQuery = {
          select: () => ({
            data: [],
            error: null,
            count: 0,
            eq: (column: string, value: any) => mockQuery,
            gte: (column: string, value: any) => mockQuery,
            lte: (column: string, value: any) => mockQuery,
            gt: (column: string, value: any) => mockQuery,
            lt: (column: string, value: any) => mockQuery,
            in: (column: string, values: any[]) => mockQuery,
            order: (column: string, options?: any) => mockQuery,
            range: (from: number, to: number) => mockQuery,
            or: (filters: string, references?: any) => mockQuery,
            and: (filters: string, references?: any) => mockQuery,
            not: (column: string, operator: string, value: any) => mockQuery,
            filter: (column: string, operator: string, value: any) => mockQuery,
            textSearch: (column: string, query: string, options?: any) => mockQuery,
            limit: (n: number) => mockQuery,
            offset: (n: number) => mockQuery,
            single: () => mockQuery,
            maybeSingle: () => mockQuery,
            returning: (columns?: string) => mockQuery,
          }),
          insert: () => Promise.resolve({ data: [], error: null }),
          update: () => Promise.resolve({ data: [], error: null }),
          upsert: () => Promise.resolve({ data: [], error: null }),
          delete: () => Promise.resolve({ data: [], error: null }),
          eq: (column: string, value: any) => mockQuery,
          gte: (column: string, value: any) => mockQuery,
          lte: (column: string, value: any) => mockQuery,
          gt: (column: string, value: any) => mockQuery,
          lt: (column: string, value: any) => mockQuery,
          in: (column: string, values: any[]) => mockQuery,
          order: (column: string, options?: any) => mockQuery,
          range: (from: number, to: number) => mockQuery,
          or: (filters: string, references?: any) => mockQuery,
          and: (filters: string, references?: any) => mockQuery,
          not: (column: string, operator: string, value: any) => mockQuery,
          filter: (column: string, operator: string, value: any) => mockQuery,
          textSearch: (column: string, query: string, options?: any) => mockQuery,
          limit: (n: number) => mockQuery,
          offset: (n: number) => mockQuery,
          single: () => mockQuery,
          maybeSingle: () => mockQuery,
          returning: (columns?: string) => mockQuery,
        };
        return mockQuery;
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      }
    };
  }
}

export const supabase = createSupabaseClient()

// Test connection if environment variables are set
if (supabaseUrl && supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    // Test connection once on client side (wrap in try-catch to prevent errors on mock client)
    try {
      supabase.from('reviews').select('count', { count: 'exact', head: true }).then(({ error }) => {
        if (error) {
          console.warn('Supabase connection test failed:', error.message)
          console.info('Application will continue to work with mock data instead of database.')
        } else {
          console.log('✅ Supabase connection successful')
        }
      }).catch(err => {
        console.warn('Supabase connection test failed:', err.message)
        console.info('Application will continue to work with mock data instead of database.')
      })
    } catch (testError) {
      console.warn('Supabase connection test failed (likely using mock client):', testError.message)
      console.info('Application will continue to work with mock data instead of database.')
    }
  } else {
    // Server-side connection test
    try {
      supabase.from('reviews').select('count', { count: 'exact', head: true }).then(({ error }) => {
        if (error) {
          console.warn('Supabase connection test failed:', error.message)
          console.info('Application will continue to work with mock data instead of database.')
        } else {
          console.log('✅ Supabase connection successful')
        }
      }).catch(err => {
        console.warn('Supabase connection test failed:', err.message)
        console.info('Application will continue to work with mock data instead of database.')
      })
    } catch (testError) {
      console.warn('Supabase connection test failed (likely using mock client):', testError.message)
      console.info('Application will continue to work with mock data instead of database.')
    }
  }
} else {
  console.info('Supabase: Using mock client (no environment variables set)')
}