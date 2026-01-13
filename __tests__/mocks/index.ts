// Re-export supabase mocks with renamed functions to avoid conflicts
export {
  createMockQueryBuilder,
  createMockSupabaseClient,
  mockQueryResponse,
  mockAuthenticatedUser as mockSupabaseAuthenticatedUser,
  mockUnauthenticated as mockSupabaseUnauthenticated,
  mockDatabaseError,
} from "./supabase.mock"

// Re-export auth-helper mocks
export {
  mockAuthenticatedUser,
  mockUnauthenticated,
  createMockGetAuthenticatedUser,
  createMockGetSupabaseClient,
  setupAuthHelperMocks,
  type AuthHelperMock,
} from "./auth-helper.mock"

// Re-export next-api mocks
export * from "./next-api.mock"
