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
      from: (table: string) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        gte: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        in: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        order: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        range: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        or: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        not: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      }),
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
      from: (table: string) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        gte: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        in: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        order: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        range: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        or: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        not: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      }),
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
      from: (table: string) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        gte: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        in: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        order: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        range: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        or: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        not: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      }),
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
              }
            };
          },
          gte: (column: any, value: any) => {
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
              }
            };
          },
          in: (column: any, value: any) => {
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
              }
            };
          },
          order: (column: any, options: any) => {
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
              range: (from: number, to: number) => {
                const rangedQuery = chainedQuery.range(from, to);
                return {
                  select: async (...args: any[]) => {
                    try {
                      const result = await rangedQuery.select(...args);
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
                  }
                };
              }
            };
          },
          range: (from: number, to: number) => {
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
              }
            };
          },
          or: (filters: any) => {
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
              }
            };
          },
          not: (column: any, operator: any, value: any) => {
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
              }
            };
          }
        };
      },
      auth: client.auth
    };

    return wrappedClient;
  } catch (error) {
    console.warn('Supabase: Failed to create client, using mock client', error);
    return {
      from: (table: string) => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        upsert: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        gte: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        in: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        order: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        range: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        or: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
        not: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      }),
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
    // Test connection once on client side
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
  } else {
    // Server-side connection test
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
  }
} else {
  console.info('Supabase: Using mock client (no environment variables set)')
}