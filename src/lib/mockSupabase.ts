// Mock Supabase client for demo purposes
export const supabase = {
  from: function(table: string) {
    return {
      select: function(columns?: string, options?: any) {
        // Handle count queries
        if (options?.count) {
          return {
            eq: function(column: string, value: any) {
              return Promise.resolve({
                data: null,
                error: null,
                count: 0
              })
            }
          }
        }
        
        // Return standard query builder
        return {
          order: function(column: string, orderOptions: any) {
            return {
              limit: function(count: number) {
                return {
                  single: function() {
                    // Mock data for demo
                    if (table === 'analytics') {
                      return Promise.resolve({
                        data: {
                          total_reviews: 45,
                          sentiment_distribution: { positive: 25, negative: 8, neutral: 12 },
                          average_rating: 4.2,
                          auto_reply_rate: 75.5,
                          time_saved_minutes: 120
                        },
                        error: null
                      })
                    }
                    return Promise.resolve({ data: null, error: null })
                  }
                }
              }
            }
          },
          eq: function(column: string, value: any) {
            return {
              order: function(orderColumn: string, orderOptions: any) {
                return {
                  limit: function(count: number) {
                    return Promise.resolve({
                      data: [],
                      error: null
                    })
                  }
                }
              },
              single: function() { return Promise.resolve({ data: null, error: null }) },
              in: function(column: string, values: any[]) { return Promise.resolve({ data: [], error: null }) }
            }
          },
          limit: function(count: number) {
            return Promise.resolve({
              data: [],
              error: null
            })
          },
          in: function(column: string, values: any[]) { return Promise.resolve({ data: [], error: null }) }
        }
      },
      insert: function(data: any) {
        console.log('Mock insert:', table, data)
        // Return inserted data with IDs
        const insertedData = Array.isArray(data) 
          ? data.map((item, index) => ({ ...item, id: `mock-${Date.now()}-${index}` }))
          : { ...data, id: `mock-${Date.now()}` }
        
        // Return an object that supports chaining with .select()
        return {
          select: function(columns?: string) {
            return {
              single: function() { return Promise.resolve({ data: insertedData, error: null }) },
              // Support array return
              then: function(callback: any) { return Promise.resolve({ data: [insertedData], error: null }).then(callback) },
              catch: function(callback: any) { return Promise.resolve({ data: [insertedData], error: null }).catch(callback) }
            }
          },
          // Support direct promise resolution
          then: function(callback: any) { return Promise.resolve({ data: insertedData, error: null }).then(callback) },
          catch: function(callback: any) { return Promise.resolve({ data: insertedData, error: null }).catch(callback) }
        }
      },
      update: function(data: any) {
        return {
          eq: function(column: string, value: any) {
            console.log('Mock update:', table, data, column, value)
            return Promise.resolve({ data, error: null })
          },
          in: function(column: string, values: any[]) { return Promise.resolve({ data, error: null }) }
        }
      },
      delete: function() {
        return {
          eq: function(column: string, value: any) {
            console.log('Mock delete:', table, column, value)
            return Promise.resolve({ data: null, error: null })
          },
          in: function(column: string, values: any[]) { return Promise.resolve({ data: null, error: null }) }
        }
      },
      upsert: function(data: any) {
        return {
          select: function(columns?: string) {
            return {
              single: function() { return Promise.resolve({ data, error: null }) }
            }
          }
        }
      }
    }
  },
  // Add auth mock
  auth: {
    getUser: function() { return Promise.resolve({ data: { user: null }, error: null }) },
    getSession: function() { return Promise.resolve({ data: { session: null }, error: null }) },
    onAuthStateChange: function() { return { data: { subscription: { unsubscribe: function() {} } } } },
    signInWithPassword: function() { return Promise.resolve({ data: null, error: null }) },
    signUp: function() { return Promise.resolve({ data: null, error: null }) },
    signOut: function() { return Promise.resolve({ error: null }) }
  },
  // Add realtime mock
  channel: function() {
    return {
      on: function() { return { subscribe: function() { return {} } } },
      subscribe: function() { return {} }
    }
  }
}
