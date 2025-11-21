# Architecture Documentation

This project follows Clean Architecture principles with clear separation of concerns.

## Directory Structure

```
src/
├── types/              # TypeScript type definitions
│   ├── proxy.ts       # Proxy-related types
│   └── config.ts      # Configuration types
├── domain/            # Business logic (framework-independent)
│   ├── exclusion-service.ts      # Proxy exclusion logic
│   ├── health-check-service.ts   # Health check orchestration
│   ├── subscription-service.ts   # Subscription handling
│   └── output-service.ts         # Output generation
├── adapters/          # Infrastructure adapters (framework-specific)
│   ├── config-adapter.ts    # GitHub Actions config adapter
│   ├── logger-adapter.ts    # GitHub Actions logger adapter
│   ├── mihomo-adapter.ts    # Mihomo API adapter
│   └── sub-store-adapter.ts # Sub-Store API adapter
├── utils/             # Shared utility functions
│   └── proxy-utils.ts       # Proxy manipulation utilities
├── config/            # Configuration templates
│   └── clash-meta-template.ts  # Clash Meta config template
└── application.ts     # Main application orchestrator
```

## Layers

### 1. Types Layer (`src/types/`)
- Pure TypeScript interfaces and types
- No dependencies on other layers
- Defines the data models used throughout the application

### 2. Domain Layer (`src/domain/`)
- Contains business logic
- Independent of frameworks and external services
- Uses interfaces for dependencies (Dependency Inversion)
- Services:
  - **ExclusionService**: Manages proxy exclusion logic with O(1) lookups using Map
  - **HealthCheckService**: Orchestrates health checking process
  - **SubscriptionService**: Handles proxy subscription downloads
  - **OutputService**: Manages output file generation

### 3. Adapters Layer (`src/adapters/`)
- Implements interfaces defined in domain layer
- Handles external dependencies (GitHub Actions, Mihomo, Sub-Store)
- Adapts external APIs to domain interfaces
- Adapters:
  - **ConfigAdapter**: Transforms GitHub Actions inputs to AppConfig
  - **ActionsLogger**: Implements Logger interface using GitHub Actions core
  - **MihomoHealthChecker**: Implements HealthChecker interface
  - **SubStoreClient**: Implements SubscriptionClient interface

### 4. Utils Layer (`src/utils/`)
- Shared utility functions
- Pure functions without side effects
- Used across all layers

### 5. Config Layer (`src/config/`)
- Configuration templates and constants
- Separated from business logic for easy modification

### 6. Application Layer (`src/application.ts`)
- Wires everything together
- Creates instances and manages dependencies
- Entry point for the application

## Design Principles

### Dependency Inversion
Domain services depend on interfaces, not concrete implementations:
```typescript
export interface HealthChecker {
  check(proxyName: string, testUrl: string, timeout: number): Promise<number>;
  updateConfig(configYaml: string): Promise<void>;
}

// Domain service depends on interface
export class HealthCheckService {
  constructor(private readonly healthChecker: HealthChecker) {}
}

// Adapter implements interface
export class MihomoHealthChecker implements HealthChecker {
  // Implementation details
}
```

### Single Responsibility
Each service has one clear responsibility:
- ExclusionService: Only manages exclusion logic
- HealthCheckService: Only orchestrates health checks
- OutputService: Only handles file output

### Open/Closed Principle
Easy to extend without modifying existing code:
- Add new health checkers by implementing `HealthChecker` interface
- Add new subscription clients by implementing `SubscriptionClient` interface
- Add new loggers by implementing `Logger` interface

## Key Improvements from Original Code

1. **No Circular Dependencies**: `proxy-utils.ts` provides shared functions
2. **Type Safety**: Replaced `any` with proper interfaces
3. **Testability**: All services use dependency injection
4. **Separation of Concerns**: Business logic separate from infrastructure
5. **Performance**: ExclusionService uses Map for O(1) lookups instead of O(n) array operations
6. **Maintainability**: Clear module boundaries and responsibilities

## Testing Strategy

Each layer can be tested independently:

- **Domain Layer**: Test business logic with mock adapters
- **Adapters Layer**: Test integration with external services
- **Utils Layer**: Test pure functions
- **Application Layer**: Integration tests

## Adding New Features

### Adding a new health checker:
1. Implement the `HealthChecker` interface in `src/adapters/`
2. Inject it into `HealthCheckService` in `src/application.ts`

### Adding a new subscription source:
1. Implement the `SubscriptionClient` interface in `src/adapters/`
2. Inject it into `SubscriptionService` in `src/application.ts`

### Adding new business logic:
1. Create a new service in `src/domain/`
2. Define interfaces for dependencies
3. Implement adapters in `src/adapters/`
4. Wire together in `src/application.ts`
