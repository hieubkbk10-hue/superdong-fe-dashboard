# Common Documentation Sources

Use this as a source-finding cheat sheet. Prefer patterns over memorizing long URL lists.

## Priority order

1. Official current/versioned docs or official `/llms.txt`
2. context7 `llms.txt` for fast discovery and AI-friendly summaries
3. Official repository docs/README/examples
4. Package registry metadata
5. Maintainer issues/discussions
6. Community posts, only with caveat

Use context7 before broad search when the URL pattern is obvious. Do not treat context7 as fresher than official docs without verification.

## context7 patterns

```txt
GitHub repo: https://context7.com/{org}/{repo}/llms.txt
Website:     https://context7.com/websites/{normalized-domain-path}/llms.txt
Topic:       .../llms.txt?topic={keyword}
```

Common examples:

```txt
https://context7.com/vercel/next.js/llms.txt
https://context7.com/shadcn-ui/ui/llms.txt?topic=date
https://context7.com/websites/ffmpeg_doxygen_8_0/llms.txt?topic=compress
```

If a pattern 404s, try official docs and WebSearch. Do not spend long guessing normalized paths.

## Official llms.txt patterns

```txt
https://docs.{name}.com/llms.txt
https://{name}.dev/llms.txt
https://{name}.io/llms.txt
https://{name}.com/llms.txt
https://www.{name}.com/llms.txt
```

Search when needed:

```txt
{name} llms.txt
{name} docs llms.txt
{name} documentation AI format
```

## Repository locations

Look for:

```txt
README.md
/docs/**
/documentation/**
/website/docs/**
/examples/**
/packages/*/README.md
CHANGELOG.md
MIGRATION.md
```

Git hosts:

```txt
https://github.com/{org}/{repo}
https://gitlab.com/{org}/{repo}
https://bitbucket.org/{org}/{repo}
```

Verify official status by checking website links, package metadata, README badges, license, activity, and owner name.

## Package registries

Use registries to find repository, homepage, docs URL, versions, and release dates.

| Ecosystem | Registry/query                                  |
| --------- | ----------------------------------------------- |
| JS/TS     | npm package page or `npm info {pkg}`            |
| Python    | PyPI page or `pip show {pkg}`                   |
| PHP       | Packagist package page or `composer show {pkg}` |
| Ruby      | RubyGems page                                   |
| Rust      | crates.io page                                  |
| Go        | pkg.go.dev and module repository                |
| Java      | Maven Central artifact page                     |
| .NET      | NuGet package page                              |

## Version-specific sources

Search with version when user gives one:

```txt
{name} {version} docs
{name} migration guide {old} to {new}
{name} changelog {version}
site:{official-domain} {version} {topic}
```

Prefer versioned URLs like `/v1/`, `/v2/`, `/docs/11.x/`, tags, release branches, or archived docs.

## Source selection rules

- Official current docs beat old examples.
- Versioned docs beat latest docs when user specifies a version.
- Migration guides beat generic API pages for upgrade questions.
- Repo examples beat blogs when docs are missing.
- Community content must be labeled as non-official.

## Output source notes

```md
Sources used:

- Official docs: [url], version/date
- Repository example: [url], tag/commit if known
- Package metadata: [url]

Caveat: [private docs, missing version, community source, untested example]
```
