# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `pnpm install` - Install dependencies
- `pnpm test` - Run tests (currently not implemented)

## Code Style Guidelines
- **JavaScript Style**: CommonJS modules (require/module.exports)
- **Classes**: Use ES6 classes with JSDoc comments for parameters and methods
- **Error Handling**: Wrap API errors with contextual messages; use try/catch in async methods
- **Naming**: camelCase for variables/methods; PascalCase for classes
- **Imports**: Group external dependencies first, then internal modules
- **Promises**: Support both promise chaining (.then/.catch) and async/await syntax
- **Type Documentation**: Use JSDoc for documenting parameter types and return values
- **Method Organization**: Group related methods together in resource classes
- **Indentation**: 2 spaces
- **HTTP Client**: Use axios for HTTP requests, with standardized response/error handling