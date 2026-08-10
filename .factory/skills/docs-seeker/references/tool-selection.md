# Tool Selection Guide

Pick the fastest tool that can answer with reliable sources.

## Decision tree

```txt
Need public docs?
→ Try context7 URL directly as discovery.
→ Verify official llms.txt/docs/repo for behavior and freshness.
→ For user-provided public URLs, fetch exact pages with the URL tool.
→ For discovered web pages, use WebSearch with full text or narrower official-domain queries.
→ If many pages, split with explorer agents.
→ If docs are in repo, read README/docs or use focused Repomix.
→ If sources are scattered, use workers/explorers with official-source priority.
```

## Tool choices

| Need                        | Tool/approach                    | Notes                                                      |
| --------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Known repo/website docs     | context7 `llms.txt` URL          | First try for public libraries.                            |
| Find official docs/repo     | WebSearch                        | Use precise query, domain, version.                        |
| Read user-provided URL      | FetchUrl                         | Prefer exact doc pages, not broad homepages.               |
| Read discovered public page | WebSearch text or focused search | Do not bypass tool contracts with shell scraping.          |
| Read many independent URLs  | Explorer agents                  | Batch by topic/source, max 5 first round.                  |
| No structured docs          | Worker/explorer agents           | Require source verification and dates.                     |
| Repo docs/code comments     | Focused repo reads or Repomix    | Include docs/README/examples, exclude binaries/build deps. |

## context7 patterns

```txt
https://context7.com/{org}/{repo}/llms.txt
https://context7.com/websites/{normalized-domain-path}/llms.txt
https://context7.com/{path}/llms.txt?topic={keyword}
```

Use topic filter for specific feature questions. If weak, fetch base `llms.txt`.

## WebSearch queries

Good:

```txt
{library} llms.txt site:{official-domain}
{library} {version} documentation site:{official-domain}
{library} official GitHub repository
{library} migration guide {old} {new}
```

Avoid vague tutorial-style queries unless official sources failed.

## Explorer prompt template

```txt
Goal: answer [specific question] for [library/version].
Sources: [URLs/files].
Extract: [install/API/config/examples/caveats].
Return: concise findings with source URL per finding and version/date caveats.
```

## Repomix/focused repo rules

Prefer focused include:

```txt
README*, docs/**, documentation/**, examples/**, packages/*/README*, *.md
```

Exclude:

```txt
node_modules/**, vendor/**, dist/**, build/**, coverage/**, *.png, *.jpg, *.pdf, *.zip
```

Use full Repomix only when docs are genuinely scattered and repo size is reasonable.

## Anti-patterns

- WebSearch before trying a known context7 URL.
- Launching agents without exact source assignments.
- Using community sources as if official.
- Refetching same URL instead of switching fallback.
- Returning links without synthesized answer.
