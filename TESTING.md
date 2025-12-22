# Testing Guide for GeoGuide-AI

## Overview

This document describes the testing infrastructure, current test coverage, and recommended areas for improvement.

## Test Infrastructure

### Setup Complete ✅

The project now has a complete testing infrastructure:

- **Test Framework**: Vitest 1.6.1
- **Testing Library**: React Testing Library 14.3.1
- **Test Environment**: jsdom (for DOM simulation)
- **Coverage Tool**: v8 (built into Vitest)

### Configuration Files

1. **vitest.config.ts** - Main test configuration
   - Globals enabled for easier test writing
   - jsdom environment for React component testing
   - Coverage reporting (text, JSON, HTML)
   - Path aliases configured

2. **src/test/setup.ts** - Test setup and mocks
   - jest-dom matchers for better assertions
   - Auto-cleanup after each test
   - Mocked window.matchMedia
   - Mocked localStorage
   - Mocked geolocation API

3. **src/test/testUtils.tsx** - Test utilities
   - Custom render function
   - Mock data (places, messages, routes)
   - Helper functions

### Available Test Scripts

```bash
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI dashboard
npm run test:coverage # Run tests with coverage report
```

## Current Test Coverage

### ✅ Fully Tested

**services/geminiService.ts** - 11 test cases covering:
- ✅ Basic message sending
- ✅ User location in tool config
- ✅ Google Search and Maps tools configuration
- ✅ JSON parsing from markdown code blocks
- ✅ Handling responses without JSON
- ✅ Malformed JSON handling
- ✅ Grounding metadata extraction (web sources)
- ✅ Map chunks extraction from metadata
- ✅ Selected place context inclusion
- ✅ Message history limiting (last 10)
- ✅ API error handling

### ❌ Not Yet Tested (Priority Order)

#### CRITICAL Priority

1. **services/mapService.ts**
   - Route fetching from OSRM API
   - Coordinate formatting
   - Error handling

2. **App.tsx**
   - Geolocation state management
   - Favorites persistence (localStorage)
   - Place selection logic
   - Route state updates

#### HIGH Priority

3. **components/ChatInterface.tsx**
   - Message submission
   - Navigation command parsing ("git"/"go")
   - Input validation
   - Favorites toggle
   - Model type switching
   - Auto-scroll behavior

4. **components/MapView.tsx**
   - Map initialization (mocked)
   - Marker placement and updates
   - Route rendering
   - Traffic layer toggle

#### MEDIUM Priority

5. **components/PlaceDetailCard.tsx**
   - Photo display logic
   - Rating rendering
   - Action button handlers

6. **components/PlaceDetailModal.tsx**
   - Modal open/close
   - Favorite toggling
   - Navigation triggering

7. **components/FavoritesList.tsx**
   - List rendering
   - Item selection/removal
   - Empty state

8. **components/ChatMessage.tsx**
   - Message rendering
   - Markdown processing
   - Loading states

9. **components/PlaceChip.tsx**
   - Button interaction
   - Data display

10. **components/GroundingChips.tsx**
    - Conditional rendering
    - Search/map results display

## How to Write Tests

### Example: Testing a Service Function

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myFunction } from './myService';

describe('myService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Example: Testing a React Component

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/testUtils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<MyComponent text="Hello" />);

    // Assert
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Mocking External Dependencies

#### Mocking API Calls

```typescript
vi.mock('./apiService', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mock' })),
}));
```

#### Mocking MapLibre GL

```typescript
vi.mock('maplibre-gl', () => ({
  Map: vi.fn(() => ({
    on: vi.fn(),
    remove: vi.fn(),
    addControl: vi.fn(),
  })),
  Marker: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  })),
}));
```

## Test Coverage Goals

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| Services | 50% (1/2) | 100% | CRITICAL |
| Core Components | 0% (0/3) | 80%+ | HIGH |
| UI Components | 0% (0/8) | 70%+ | MEDIUM |
| Overall | ~7% | 75%+ | - |

## Next Steps

### Immediate (Next 1-2 Days)

1. **Add mapService tests** - Test route fetching and error handling
2. **Add App.tsx tests** - Test state management and localStorage

### Short-term (Next Week)

3. **Add ChatInterface tests** - Test message flow and interactions
4. **Add MapView tests** - Test map integration (mocked)

### Medium-term (Next 2 Weeks)

5. **Add remaining component tests** - Complete UI coverage
6. **Set up CI/CD testing** - Run tests on every commit
7. **Add integration tests** - Test component interactions

## Continuous Integration

### Recommended GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci --legacy-peer-deps
      - run: npm test -- --run
      - run: npm run test:coverage
```

## Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test** (when possible)
3. **Test behavior, not implementation**
4. **Mock external dependencies**
5. **Use descriptive test names**
6. **Keep tests fast and isolated**
7. **Aim for high coverage on critical paths**

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Coverage Reports

To generate and view coverage reports:

```bash
npm run test:coverage
```

This will create:
- Console output (text format)
- `coverage/index.html` (interactive HTML report)
- `coverage/coverage-final.json` (JSON data)

Open `coverage/index.html` in a browser to see detailed line-by-line coverage.
