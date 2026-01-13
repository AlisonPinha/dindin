import { vi } from "vitest"

type MockQueryResult<T> = {
  data: T | null
  error: { code: string; message: string } | null
  count?: number
}

interface MockQueryBuilder<T = unknown> {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  gt: ReturnType<typeof vi.fn>
  lt: ReturnType<typeof vi.fn>
  like: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  then: (resolve: (value: MockQueryResult<T>) => MockQueryResult<T>) => Promise<MockQueryResult<T>>
}

// Cria um query builder mockado que pode ser encadeado
export function createMockQueryBuilder<T = unknown>(
  resolvedValue: MockQueryResult<T> = { data: null, error: null }
): MockQueryBuilder<T> {
  const builder: MockQueryBuilder<T> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolvedValue),
    maybeSingle: vi.fn().mockResolvedValue(resolvedValue),
    then: (resolve) => Promise.resolve(resolvedValue).then(resolve),
  }

  // Retorna o builder para encadeamento
  Object.values(builder).forEach((fn) => {
    if (typeof fn === "function" && fn !== builder.single && fn !== builder.maybeSingle && fn !== builder.then) {
      fn.mockReturnValue(builder)
    }
  })

  return builder
}

// Cria um cliente Supabase mockado
export function createMockSupabaseClient(overrides: Record<string, MockQueryBuilder> = {}) {
  const defaultBuilder = createMockQueryBuilder()

  return {
    from: vi.fn((table: string) => {
      return overrides[table] || defaultBuilder
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      }),
    },
  }
}

// Helper para configurar respostas de query
export function mockQueryResponse<T>(
  client: ReturnType<typeof createMockSupabaseClient>,
  table: string,
  data: T | T[] | null,
  error: { code: string; message: string } | null = null
) {
  const builder = createMockQueryBuilder({
    data,
    error,
    count: Array.isArray(data) ? data.length : data ? 1 : 0,
  })

  client.from.mockImplementation((t: string) => {
    if (t === table) return builder
    return createMockQueryBuilder()
  })

  return builder
}

// Helper para simular usuário autenticado
export function mockAuthenticatedUser(
  client: ReturnType<typeof createMockSupabaseClient>,
  user: { id: string; email: string }
) {
  client.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: user.id,
        email: user.email,
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
    },
    error: null,
  })
}

// Helper para simular erro de autenticação
export function mockUnauthenticated(client: ReturnType<typeof createMockSupabaseClient>) {
  client.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: "Not authenticated", status: 401 },
  })
}

// Helper para simular erro no banco
export function mockDatabaseError(
  client: ReturnType<typeof createMockSupabaseClient>,
  table: string,
  errorCode: string = "PGRST116",
  errorMessage: string = "Record not found"
) {
  const builder = createMockQueryBuilder({
    data: null,
    error: { code: errorCode, message: errorMessage },
  })

  client.from.mockImplementation((t: string) => {
    if (t === table) return builder
    return createMockQueryBuilder()
  })

  return builder
}
