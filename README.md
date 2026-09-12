# Environment Program

**How Technology Can Help Save the Environment**

A reference guide on the role of technology in advancing the mission of the United Nations Environment Programme (UNEP).

📖 **Read the full documentation:** https://akashtalole.github.io/Environment-Program/

## Contents

- [Home](docs/index.md)
- [Technology Areas](docs/technology-areas.md)
- [Use Cases](docs/use-cases.md)
- [Risks & Responsible Deployment](docs/risks.md)
- [Recommendations](docs/recommendations.md)

## Local Development

This site is built with [MkDocs](https://www.mkdocs.org/) and the [Material theme](https://squidfunk.github.io/mkdocs-material/).

```bash
pip install -r requirements.txt
mkdocs serve
```

Then open http://127.0.0.1:8000/ in your browser.

The site is automatically built and deployed to GitHub Pages on every push to `main` via `.github/workflows/gh-pages.yml`.

## Backend

[`backend/`](backend/) is a separate Node.js service that polls authenticated
environmental data feeds (NASA FIRMS, OpenAQ, Global Forest Watch) that the
static docs site can't call directly, and serves them over a JSON API. See
[`backend/README.md`](backend/README.md) for setup — it's optional and
doesn't affect the GitHub Pages deployment.

## License

See [LICENSE](LICENSE) for details.
