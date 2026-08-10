# Limitations & Success Criteria

Use this file to know when documentation discovery is reliable enough, when to switch strategy, and what caveats to report.

## Hard limits

| Limit                 | What it means                                             | Agent action                                                        |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| Private/auth docs     | Cannot log in, use credentials, or read internal portals. | Ask for public links or summarize from public README/package pages. |
| Rate limits           | Anonymous APIs can return 403/429 or throttle.            | Stop retrying the same endpoint, switch source, mention the limit.  |
| Real-time freshness   | Results are a snapshot at access time.                    | Include access date and version/source used.                        |
| Interactive docs      | Cannot execute playgrounds or verify UI/API behavior.     | Mark examples as untested, link to playground.                      |
| Video/image-only docs | Text extraction may be unavailable or lossy.              | Prefer transcripts, companion posts, README, or official text docs. |

## context7 limits

context7 is a fast discovery path, but not proof of latest behavior.

| Case                                 | Fallback                                                |
| ------------------------------------ | ------------------------------------------------------- |
| Library not indexed or 404           | Try official `/llms.txt`, then WebSearch.               |
| Topic filter misses content          | Try broader/synonym topics, then fetch base `llms.txt`. |
| Website path normalization uncertain | Try GitHub repo form and website form.                  |
| Source is stale or version unclear   | Verify against official docs/release notes.             |

## Soft limits, may still work

| Challenge           | Risk                                      | Best response                                                 |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Very large repo     | Repomix slow, huge output, memory issues. | Shallow clone, include only `docs/**`, `README*`, examples.   |
| Scattered docs      | Hard to cover fully.                      | Split by topic/source with parallel agents.                   |
| Non-English docs    | Translation nuance loss.                  | Quote source terms and note language.                         |
| Deprecated versions | Conflicting guidance.                     | Pin version and label legacy/current clearly.                 |
| Community-only docs | Lower authority.                          | Prefer official package metadata and disclose source quality. |

## Success criteria

A documentation search is good enough when it satisfies these checks:

1. **Relevant answer**: directly answers the user's requested library/version/topic.
2. **Best available source**: checked official/current or versioned docs before relying on lower-authority sources.
3. **Efficient path**: used direct source reads or parallel agents only when they reduced real work.
4. **Source attribution**: includes URLs, versions, and access date when relevant.
5. **Gap disclosure**: states missing, conflicting, private, untested, or stale areas.
6. **Actionable output**: gives commands, code snippets, API names, or next steps, not only links.

## Report caveats, compact templates

### Access blocked

```md
Access limitation: the full docs require authentication. I used public sources: [urls]. Missing areas: [list].
```

### Snapshot freshness

```md
Snapshot: accessed on YYYY-MM-DD. Version/source checked: [version/url]. Verify official release notes for changes after this date.
```

### Untested example

```md
Example is copied/adapted from docs and not executed in this environment. Test it against your project version.
```

### Conflicting docs

```md
Conflict found: source A says ..., source B says .... I prioritized [official/current/versioned] because ....
```

## Stop rules

Stop searching and answer when:

- The core question is answered with official or high-confidence sources.
- Further search is only adding duplicates.
- A hard limit blocks access and no public equivalent exists.
- The user asked for quick guidance, not exhaustive research.

Offer follow-up only when a clear missing area remains.
