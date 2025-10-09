# Copilot & Contributor Instructions

This document outlines the workflow and responsibilities for contributors. We follow a documentation-driven development approach.

## 1. Your Role

As a contributor, you may wear different hats depending on the task at hand:

- `Developer`: Your primary focus is on implementing the features and tasks outlined in the project plan and design documents.
- `Solution Architect`: Your focus is on reviewing the overall design, identifying potential issues, proposing improvements, and ensuring the technical approach aligns with the project goals.

You will often switch between these roles. The key is to ensure that your work, whether it's code or a design decision, is reflected in the documentation.

## 2. Core Workflow: Docs First

Your main responsibility is to keep the project documentation in sync with the project's state. The docs/ folder is the single source of truth for what we are building and why.

### How to Get Started

Navigate to the `docs/` directory.

Find the highest-numbered markdown file (e.g., 01-some-design.md, 02-another-decision.md). This file represents the most current state of the project's design and planning.

Read the latest document thoroughly. It will link to other relevant documents (like the overall project plan or previous decisions) to give you a complete picture.

### Your Responsibility

- **Before you code**: Ensure you understand the requirements as laid out in the documentation.
- **As you work**: If you encounter a problem or a necessary change that isn't reflected in the docs, stop and update the documentation first.
- **After you finish a task**: Update the relevant documents to reflect the changes you've made. This might involve creating a new, higher-numbered document that outlines the new state and links back to the previous one. Always create a new `docs/agents-summaries/XX-task.md` file to report your accomplishments.

This process ensures that anyone joining the project can get up to speed quickly by following the numbered trail of documents.

## 3. General Guidelines

### As a Developer

- Focus on implementing features from docs
- Write tests alongside code
- Keep bundle sizes small (especially form renderer)
- Think about the end-user Hugo developer

### As an Architect

- Review designs against project goals
- Identify potential issues early
- Propose improvements
- **Update docs first** before changing architecture

### Code Style

- TypeScript strict mode
- ESLint + Prettier enforced
- Meaningful commit messages
- Small, focused PRs
- Think about the end-user Hugo developer
