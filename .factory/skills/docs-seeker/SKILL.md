---
name: docs-seeker
version: 2.0.0
description: |
  Use when the user needs current, source-backed technical documentation from official docs, llms.txt, Context7, public GitHub repositories, package READMEs, release notes, or version-specific API references, especially when comparing sources or avoiding stale community content.
---

# Documentation Discovery

Find technical docs with a clear source route, freshness check, and citation contract.

## Ground rules

1. Official current/versioned docs are the source of truth for behavior.
2. Context7 and `llms.txt` are accelerators, not proof of freshness by themselves.
3. If the user asks for "latest", use the current date from the session and verify current docs, release notes, branch, tag, or package version when possible.
4. If the user asks to compare docs with a README, both sources are required. Do not treat the README as a fallback.
5. Avoid community/blog/forum content as core evidence when the user asks for official, latest, or non-stale docs.
6. Use parallel agents only for independent source sets or large docs. Do not parallelize small reads just because there are several URLs.
7. Every important claim should point to a source URL, section/title, version/date, or repo branch/tag/commit when available.

## Routing

### 1. Request route

| User asks for                       | Required route                                                  |
| ----------------------------------- | --------------------------------------------------------------- |
| Latest docs for a library/framework | Official current docs plus release/version check                |
| Specific version                    | Versioned docs, tag, branch, changelog, or package version      |
| `llms.txt` docs                     | Context7 pattern, official `/llms.txt`, then official docs      |
| GitHub README or package comparison | Official docs and repo README are both mandatory                |
| Migration or behavior difference    | Old docs, new docs, migration guide, release notes              |
| Sparse docs or unknown project      | Official site, repo docs, package registry, then broader search |

### 2. Source confidence route

Use the highest available source tier:

1. Official versioned/current documentation.
2. Official release notes, changelog, migration guide, or API reference.
3. Official repository README, docs tree, examples, or tagged source.
4. Package registry metadata linking to homepage/repository.
5. Maintainer issue/discussion with date and caveat.
6. Community content only as non-core context, clearly labeled.

When sources conflict, prefer the higher tier and mention the conflict.

### 3. Volume route

| Input size               | Approach                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1-3 small pages          | Read directly. No subagent unless source is complex.                                                         |
| 4-10 independent pages   | Use 2-4 explorers by topic/source.                                                                           |
| 11+ pages                | First batch max 5 explorers on highest-value pages. Aggregate before launching more.                         |
| Huge GitHub repo         | Explore structure first, then read README/docs/examples. Use Repomix only if focused reads are insufficient. |
| Multi-version comparison | Split by version/source so findings do not mix.                                                              |

## Workflow

1. **Parse the target**
   - Library, framework, package, repo, or website.
   - Topic, API, method, or feature.
   - Version requirement, defaulting to latest/current.
   - Required comparison sources, such as official docs vs README.
   - Staleness constraints, such as "avoid community content".

2. **Discover source candidates**
   - Try Context7 patterns for `llms.txt`:
     - GitHub repo: `https://context7.com/{org}/{repo}/llms.txt`
     - Website: `https://context7.com/websites/{normalized-domain-path}/llms.txt`
     - Topic: append `?topic={query}`
   - Try official `llms.txt` patterns:
     - `https://docs.<domain>/llms.txt`
     - `https://<project>.dev/llms.txt`
     - `https://<project>.io/llms.txt`
   - Search for official docs, release notes, GitHub repo, package registry, and README.
   - For URLs the user explicitly provided, use the URL fetch tool if it is valid and public.
   - For discovered web pages, use web search results with full text when available. Do not bypass tool contracts with shell scraping.

3. **Collect evidence**
   - Read official docs first for behavior.
   - Read repo README/docs/examples when the user asks for repository comparison or official docs are incomplete.
   - For public GitHub repos, prefer README, `docs/**`, `examples/**`, changelog, and tagged files before full repo packing.
   - Use Repomix only when the repo is too large for focused reads and the environment has or can safely run it.
   - Give subagents exact sources, exact questions, version constraints, and required citation format.

4. **Validate freshness**
   - Record accessed date.
   - Record docs version, package version, branch, tag, or commit when visible.
   - If "2026" or another year does not map to a project version, state the current stable version checked on that date.
   - If the source has no date/version, mark confidence lower and cross-check with release notes or package registry.

5. **Synthesize by user question**
   - Answer the direct question first.
   - Compare behavior by topic, not by source order.
   - Deduplicate repeated claims.
   - Label gaps, conflicts, stale sources, and assumptions.

## Tool selection

| Need                                   | Tool/pattern                                            |
| -------------------------------------- | ------------------------------------------------------- |
| Find public docs, repos, release notes | `WebSearch`                                             |
| Fetch user-provided public URL         | `FetchUrl`                                              |
| Explore many local/project files       | `Glob`, `Grep`, `Read`                                  |
| Split broad reading                    | `Task` explorer with non-overlapping source assignments |
| Analyze a huge public repo             | Focused repo docs first, Repomix only if needed         |
| Verify current date relevance          | Current system date                                     |

## Output format

```markdown
## Answer

[Direct answer]

## Evidence

| Claim | Source              | Version/date |
| ----- | ------------------- | ------------ |
| ...   | URL + section/title | ...          |

## Comparison

[Only if multiple sources were required]

## Caveats

- [Missing version, stale source risk, conflict, or unsupported area]
```

For quick answers, keep the table small. For migrations or comparisons, include old behavior, new behavior, and what to change.

## Stop checklist

- [ ] Official/current or versioned source checked.
- [ ] Required README/repo/package source checked if user asked for comparison.
- [ ] Stale/community sources excluded or clearly labeled.
- [ ] Version, date, branch, tag, or caveat recorded.
- [ ] Claims have source-backed evidence.
- [ ] Parallel agents were used only when source sets were independent or large.
- [ ] Final answer states methodology and gaps.

## Common mistakes

- Treating Context7 as fresher than official docs without verification.
- Stopping after `llms.txt` when the user requested README/package comparison.
- Launching parallel agents for small source sets.
- Listing URLs at the end without tying claims to sources.
- Using community posts as core evidence after the user asked to avoid stale content.
- Installing or cloning tooling before focused reads prove it is needed.

## References

- [WORKFLOWS.md](./WORKFLOWS.md)
- [Tool Selection](./references/tool-selection.md)
- [Documentation Sources](./references/documentation-sources.md)
- [Error Handling](./references/error-handling.md)
- [Best Practices](./references/best-practices.md)
- [Performance](./references/performance.md)
- [Limitations](./references/limitations.md)
