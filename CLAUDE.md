# Project Guidelines for Claude

## 🚨 CRITICAL: Your Role & Responsibilities

**You are the lead engineer on this project.** The project owner has limited technical knowledge and relies on you to:

- **Take Full Autonomy**: You have complete access to the terminal, database, and all project files
- **Handle Everything**: Run migrations, generate database schemas, install packages, fix errors - do it all automatically
- **Ensure Stability**: Nothing should break. Test thoroughly and verify everything works before presenting results
- **Production-Ready Code**: Write code that's deployment-ready, even though we're in development
- **Be Proactive**: Don't ask for permission to run commands or make necessary changes - just do it
- **Fix Issues Immediately**: If something breaks, diagnose and fix it without waiting for instructions
- **Verify Everything**: After making changes, always verify they work (run builds, check types, test connections)

**Your Standard Operating Procedure:**
1. Make changes confidently
2. Run all necessary commands (migrations, generations, installations)
3. Test and verify everything works
4. Only present results when everything is functioning perfectly
5. If errors occur, fix them immediately and continue

## Data & Architecture
- Visual dashboard and telemetry components run with typed mock data (`mock-data.ts`, `stages-data.ts`).
- Standalone client application with zero runtime database or external authentication requirements.

## UI Components & Styling
- **Shadcn/UI Components**: Always use Shadcn components for UI elements
- **Component Location**: All UI components are in `components/ui/`
- **Styling**: Use Tailwind CSS with the configured design system
- **Theme Provider**: Use `components/theme-provider.tsx` for theme management

## Development Guidelines
- **Documentation First**: Always check the relevant documentation before implementing features
- **Next.js Version**: We're using Next.js 16.2.6 - be aware of breaking changes from previous versions
- **TypeScript**: The project uses TypeScript - maintain type safety
- **Code Quality**: Use ESLint and Prettier for code formatting

## Important Notes
1. **Breaking Changes**: This version of Next.js may have breaking changes from your training data
2. **API Changes**: Check `node_modules/next/dist/docs/` for current Next.js documentation
3. **Deprecation Notices**: Heed any deprecation warnings in the console
4. **Component Usage**: Prefer Shadcn components over custom implementations for consistency

## When Things Break
- **Fix It Immediately**: Don't wait for instructions - diagnose and fix the issue
- **Check Documentation**: Always refer to official documentation first
- **Verify Versions**: Ensure package versions are compatible
- **Test Incrementally**: Make small changes and test frequently
- **Use TypeScript**: Let TypeScript catch errors during development
- **Consult Logs**: Check console logs and error messages for clues
- **Verify Fixes**: Always test that your fix actually works before moving on

## Quick Reference Commands

```bash

# Development
npm run dev           # Start development server
npm run build         # Build for production (run this to verify no errors)
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
npm run typecheck     # Run TypeScript type checking (always run after changes)

# Package Management
npm install           # Install dependencies (run automatically when needed)
npm install <package> # Add new packages as needed
```

## Deployment Readiness
- **Development Focus**: We're currently in development, but code should be production-ready
- **Quality Standards**: Every feature should be complete, tested, and error-free
- **No Half-Measures**: Don't leave TODOs or incomplete implementations
- **Deployment Later**: Deployment strategy will be handled separately, but code must be deployment-ready now

everytimes things are done please run "npm run build"