---
name: skill-writer
version: 2.0.0
description: |
  Use when the user wants to create, improve, or validate Factory Droid skills in `.factory/skills/` or `~/.factory/skills/`, turn repeatable session learnings into reusable skills, fix skill discovery/frontmatter, or align skills with marketplace plugin conventions.
---

# Skill Writer

Build Factory Droid skills that future agents can discover and follow without guessing.

## Ground rules

1. One skill owns one capability. If the scope needs "and also", split it.
2. Skills are for repeatable, non-obvious workflows, preferences, pitfalls, or tool patterns. Do not create a skill for a one-off note.
3. Project skills live in `.factory/skills/<skill-name>/SKILL.md`; personal skills live in `~/.factory/skills/<skill-name>/SKILL.md`.
4. `SKILL.md` carries triggers, workflow, hard rules, validation, and common mistakes. Move long examples or catalogs to `references/`.
5. When updating a skill, bump `version`. Patch for clarifications, minor for new behavior, major for breaking workflow changes.
6. User, system, developer, and project instructions still take precedence over a skill.

## When to create or update

| Situation                                                       | Decision                                              |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| Repeated workflow agents keep rediscovering                     | Create or improve a skill                             |
| User preference corrects agent behavior more than once          | Capture it                                            |
| Tool sequence has order, fallback, or safety traps              | Capture it                                            |
| Single project convention already fits `AGENTS.md` or standards | Put it there unless agents must load it as a workflow |
| Generic public docs already explain it well                     | Do not duplicate                                      |
| One-off session story with no reusable pattern                  | Do not create a skill                                 |

## Workflow

1. **Define the trigger**: write the exact user situations that should load the skill.
2. **Check existing skills**: improve an existing skill if it owns the capability.
3. **Choose the location**: project for team/repo conventions, personal for user-wide workflows.
4. **Write pressure scenarios first**: describe at least one user request where an agent using the current guidance would hesitate or do the wrong thing.
5. **Write the frontmatter**:

```yaml
---
name: skill-name
version: 1.0.0
description: |
  Use when the user wants to <trigger>, <trigger>, or <trigger>.
---
```

6. **Write the body**: keep it executable and short.
7. **Verify discovery**: the description must make it obvious when to load the skill.
8. **Verify behavior**: the pressure scenario should now pass without extra interpretation.
9. **Report what changed**: mention files, version bump, and validation done.

## Frontmatter rules

| Field           | Rule                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------- |
| `name`          | Lowercase letters, numbers, and hyphens. Match the folder unless preserving legacy compatibility. |
| `version`       | Required. Use semantic versioning.                                                                |
| `description`   | Start with "Use when...". Describe trigger conditions, not the whole workflow.                    |
| `allowed-tools` | Optional. Use only when tool restriction is part of the skill contract.                           |

Good:

```yaml
description: |
  Use when the user needs source-backed technical documentation, version-specific API behavior, or a comparison between official docs and repository README content.
```

Bad:

```yaml
description: Helps with docs and best practices.
```

## Body shape

```md
# Skill Name

One short purpose paragraph.

## Ground rules

- Hard constraints.

## When to use

- Concrete triggers, if frontmatter needs more detail.

## Workflow

1. First action.
2. Main route or checklist.
3. Validation.

## Output

- Exact response shape when relevant.

## Common mistakes

- What agents tend to get wrong.
```

## Writing rules

- Prefer tables and checklists over long essays.
- Use strong verbs and concrete triggers.
- Do not write marketing copy.
- Do not bury the first action.
- Do not duplicate `AGENTS.md`, standards, or public docs unless the skill adds routing, judgment, or safety.
- Link references only when they are useful after activation.
- Include validation or stop criteria. A skill with no pass condition leaves agents guessing.

## Verification checklist

- [ ] Folder and `name` are compatible.
- [ ] `version` exists and was bumped when updating.
- [ ] Description starts with "Use when" and lists real trigger situations.
- [ ] Main workflow is executable without reading every reference.
- [ ] Pressure scenario that failed before now passes.
- [ ] Common mistakes cover the observed failure modes.
- [ ] Large examples are in `references/`, not the main skill.
- [ ] Rules do not conflict with higher-priority instructions.

## Common mistakes

- Writing a generic "best practices" skill with no trigger.
- Summarizing the workflow in `description` so agents skip the body.
- Creating a new skill instead of improving the existing owner.
- Putting project skills outside `.factory/skills/`.
- Forgetting `version`.
- Copying a session narrative instead of extracting a reusable pattern.
- Adding examples that do not change agent behavior.
