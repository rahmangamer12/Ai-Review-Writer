# AutoReview AI - Skills Documentation

This document provides detailed information about the skills system in the AutoReview AI project and how to use various capabilities available through Claude Code.

## Available Skills

### 1. Keybindings Help Skill
**Name:** `keybindings-help`
**Description:** Used when customizing keyboard shortcuts, rebind keys, adding chord bindings, or modifying the `~/.claude/keybindings.json` file.
**Usage Examples:**
- Rebind Ctrl+S for saving
- Add a chord shortcut for submitting
- Change the submit key
- Customize keybindings in the configuration file

## Using Skills in Claude Code

Skills in Claude Code are specialized capabilities that provide domain-specific functionality. To use a skill, you reference it with the slash command format (e.g., `/keybindings-help`).

**How to use skills:**
1. Type the slash command followed by any parameters (e.g., `/keybindings-help`)
2. Claude will execute the appropriate skill based on the available tools
3. Some skills may require additional input or parameters

**Current available skill:**
- `/keybindings-help` - For customizing keyboard shortcuts and keybindings

## Project-Specific Skills

While this project doesn't have custom skills defined yet, you can create skills specific to the AutoReview AI platform by adding them to a `.claude/skills/` directory in your project.

### Potential Custom Skills for AutoReview AI

The following are examples of custom skills that could be implemented for this project:

#### 1. Review Management Skill
A skill to help manage reviews, analyze sentiment, or generate replies.

#### 2. Platform Integration Skill
A skill to help connect or manage platform integrations (Google, Facebook, Yelp, etc.).

#### 3. Analytics Dashboard Skill
A skill to help create or modify the 3D analytics dashboard components.

#### 4. AI Configuration Skill
A skill to help configure AI settings and parameters for the LongCat AI integration.

## Creating Custom Skills

To create a custom skill for the AutoReview AI project:

1. Create a `.claude/skills/` directory in your project root
2. Add a skill file with the format `skill-name.ts`
3. Define the skill's functionality, parameters, and behavior
4. Document the skill in this file

Example skill structure:
```typescript
// .claude/skills/review-analyzer.ts
export default {
  name: 'review-analyzer',
  description: 'Analyze reviews and generate insights',
  parameters: {
    // Define expected parameters
  },
  handler: async (context, parameters) => {
    // Skill implementation
  }
};
```

## Current Skill Usage Limitations

Currently, the only defined skill in this project is the `keybindings-help` skill. As the project grows, additional skills can be defined to streamline common development tasks.

## Development Skills

Beyond the defined skills, Claude Code can assist with various development tasks in the AutoReview AI project:

- **Code Generation:** Creating new components, API routes, or utility functions
- **Code Review:** Analyzing existing code for improvements, bugs, or best practices
- **Debugging:** Identifying and fixing issues in the application
- **Testing:** Writing or updating unit and integration tests
- **Documentation:** Creating or updating documentation files
- **Architecture:** Planning and implementing new features following project patterns

## Best Practices for Skill Usage

1. **Use existing skills first:** Check if there's an existing skill that can help before creating new functionality
2. **Follow project patterns:** When implementing new features, follow the existing architecture and patterns
3. **Maintain consistency:** Ensure new skills match the overall project structure and coding standards
4. **Document thoroughly:** Always update documentation when adding new skills or capabilities
5. **Test functionality:** Verify that skills work as expected before using them in production code

## Integration with Project Tech Stack

Skills in this project can leverage:
- Next.js 16 and React 19 for UI components
- TypeScript for type safety
- Tailwind CSS for styling
- Clerk for authentication-related skills
- Supabase for database-related operations
- LongCat AI for AI-related functionality
- React Three Fiber for 3D visualization skills
- Zustand for state management skills

For more specific help with any of these capabilities, please ask about the particular task you want to accomplish in the AutoReview AI project.