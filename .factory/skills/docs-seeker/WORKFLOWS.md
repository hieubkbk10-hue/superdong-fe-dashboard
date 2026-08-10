# Documentation Discovery Workflows

Use these workflows when the main `SKILL.md` is not enough. Keep exploration bounded and source-backed.

## Workflow 1, library with context7

```txt
1. Build context7 URL from repo or website.
2. Fetch base llms.txt, or topic URL if user asks a specific feature.
3. Extract the most relevant links/content.
4. If latest, official, or version-specific behavior matters, verify with official docs or release notes.
5. If 4+ independent pages remain, split them across explorers.
6. Answer by topic, cite sources, mention version/date.
```

Best for: popular public libraries and framework docs.

## Workflow 2, context7 miss but official docs exist

```txt
1. Try official /llms.txt patterns.
2. WebSearch for "{library} llms.txt" and official docs domain.
3. Fetch official docs pages directly.
4. Use package registry/repo only to confirm homepage/version.
5. Report that context7 was unavailable if relevant.
```

Best for: newer libraries or docs not indexed by context7.

## Workflow 3, no llms.txt, use repository docs

```txt
1. Find and verify official repo.
2. Read README and docs tree first.
3. Focus on README*, docs/**, examples/**, migration/changelog files.
4. Use Repomix only when focused reads are insufficient.
5. Exclude binaries, build output, vendor deps, generated files.
```

Best for: open-source packages with docs in repo.

## Workflow 4, scattered web sources

```txt
1. Identify official website, package registry, repo, release notes.
2. Use parallel agents by source type or topic.
3. Give each agent exact source list and requested question.
4. Merge findings by user topic, not by source.
5. Label community/non-official info clearly.
```

Best for: proprietary tools, sparse docs, or ecosystem questions.

## Workflow 5, multiple versions or migration

```txt
1. Pin requested versions.
2. Split old docs, new docs, and migration guide.
3. Extract behavior difference and action needed.
4. Prefer official migration/release notes over examples.
5. Final answer format: old behavior, new behavior, migration steps, caveats.
```

Best for: upgrade questions and breaking changes.

## Agent distribution

| Input size | Approach                                            |
| ---------- | --------------------------------------------------- |
| 1-3 pages  | Read directly or one explorer.                      |
| 4-10 pages | 2-4 explorers by topic/source.                      |
| 11+ pages  | First batch max 5 explorers on highest-value pages. |
| Huge repo  | One explorer for structure, then focused follow-up. |

Agent prompt must include:

- Goal and exact question.
- URLs/files assigned.
- Version constraints.
- Required citation format.
- Expected output shape.

## Common pitfalls

| Pitfall              | Avoid by                                              |
| -------------------- | ----------------------------------------------------- |
| Over-parallelization | Cap first batch, merge before launching more.         |
| Duplicate reads      | Assign non-overlapping topics.                        |
| Poor source quality  | Prioritize official/versioned sources.                |
| No caveats           | State private, stale, conflicting, or untested areas. |
| Link dump            | Synthesize answer first, sources second.              |

## Output templates

### Quick answer

```md
## Answer

[direct answer]

## Source

- [Official docs](url), version/date

## Note

[caveat if any]
```

### Research summary

```md
## Finding

[conclusion]

## Evidence

- [source 1]
- [source 2]

## Gaps

[missing/private/conflicting info]

## Next step

[command, code path, or verification]
```

### Migration answer

```md
## Old behavior

...

## New behavior

...

## What to change

1. ...
2. ...

## Caveats

...
```
