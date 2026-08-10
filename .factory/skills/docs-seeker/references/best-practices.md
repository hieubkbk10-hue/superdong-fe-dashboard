# Best Practices

Goal: find reliable technical docs quickly, then answer with enough source context for the user to trust and continue.

## Core rules

1. **Use context7 for fast discovery** when a direct `llms.txt` pattern is known, then verify behavior against official/current sources when freshness matters.
2. **Prefer official/versioned sources** over mirrors, blogs, old issues, and generated summaries.
3. **Parallelize only independent reading**: split URLs/topics across agents only when it reduces real work, then synthesize yourself.
4. **Pin version and date** when docs can drift.
5. **Aggregate by user question**, not by source order.
6. **Disclose gaps**: private docs, rate limits, untested examples, conflicting versions.
7. **Stop when useful**: avoid exhaustive browsing when the answer is already high-confidence.

## context7 discovery workflow

```txt
Known GitHub repo → https://context7.com/{org}/{repo}/llms.txt
Known website     → https://context7.com/websites/{normalized-domain-path}/llms.txt
Specific topic    → append ?topic={keyword}
Useful result     → verify official docs/release notes when latest/version-specific
404/weak result   → official /llms.txt → WebSearch → repo analysis
```

Use topic filters for focused asks, but fall back to base `llms.txt` if wording may differ.

## Source quality ladder

| Priority | Source                              | Notes                           |
| -------- | ----------------------------------- | ------------------------------- |
| 1        | Official versioned docs             | Best for API behavior.          |
| 2        | Official release/migration docs     | Best for breaking changes.      |
| 3        | Official repository README/examples | Good when docs are sparse.      |
| 4        | Package registry metadata           | Good for repo/homepage/version. |
| 5        | Maintainer issue/discussion         | Useful with date caveat.        |
| 6        | Community blog/tutorial             | Last resort, always label.      |

## Parallel agent use

Use agents when there are many URLs, versions, or topics.

| Scope         | Suggested split                                |
| ------------- | ---------------------------------------------- |
| 1-3 pages     | Read directly or one explorer.                 |
| 4-10 pages    | 2-4 agents by topic.                           |
| 11+ pages     | First batch: critical docs only, max 5 agents. |
| Multi-version | One agent per version or migration path.       |

Give each agent a bounded brief: source URLs, exact topic, expected output, and source citation requirement.

## Good aggregation

Bad:

```md
Source 1 says...
Source 2 says...
Source 3 says...
```

Good:

```md
## Install

[answer synthesized from sources]

## Config

[answer synthesized from sources]

## Caveats

[version/source gaps]
```

## Version handling

- If user names a version, search that exact version first.
- If user says latest, use current date and current docs.
- If sources conflict, label each source by version/date and choose the requested/current one.
- For migrations, separate "old behavior", "new behavior", and "action needed".

## Report format

Keep reports compact:

```md
## Answer

[direct answer]

## Evidence

| Claim | Source                             | Version/date |
| ----- | ---------------------------------- | ------------ |
| ...   | [Official docs](url) section/title | ...          |

## Notes

- [caveat or missing area]
```

## Anti-patterns

- Searching broadly before trying known `llms.txt` patterns.
- Reading docs sequentially when pages are independent.
- Citing a source but not extracting the answer.
- Giving stale guidance without version/date.
- Overloading the user with every found link.
- Treating context7 as proof of latest behavior without official verification.
