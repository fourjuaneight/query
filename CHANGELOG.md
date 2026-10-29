# Changelog

All notable changes to this project will be documented in this file.

## [2.1.2] - 2026-10-29

### Bug Fixes

- [Filter music search by artist name, not Deezer's artist query.](https://github.com/fourjuaneight/query/commit/bde8e430aa196e771eaa348539eee60192b0072d)

### Features

- [**breaking**] [Replace Discogs with Deezer for music search.](https://github.com/fourjuaneight/query/commit/48aebe315cf4b8eab22b9eadae83f57fb8c176f4)

### Miscellaneous Tasks

- [Update Changelog.](https://github.com/fourjuaneight/query/commit/a4424775e18c9b0f84f529b32e2125ef8d611e44)

## [2.1.1] - 2026-10-28

### Features

- [Return track lists from Qobuz album search.](https://github.com/fourjuaneight/query/commit/8d9d326ddf14551258fa7bfd659d83e94ec5629b)

### Miscellaneous Tasks

- [Update Changelog.](https://github.com/fourjuaneight/query/commit/edef8b7314351e37f7af3f70d20358aadc20a53a)

## [2.1.0] - 2026-10-28

### Bug Fixes

- [Update Husky setup for v9 so the pre-commit hook runs.](https://github.com/fourjuaneight/query/commit/194edd56152437f9835a8dac52b06e3f06526cf9)
- [Handle optional id route params after the Hono update.](https://github.com/fourjuaneight/query/commit/32186e1f24a2e766f39c9818a0b1e4474264e079)
- [Update books routes to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/890d0193048c1d86e7a4ee4489d8a374195a58ed)
- [Handle OpenLibrary responses without a records field.](https://github.com/fourjuaneight/query/commit/44f69c975c79ed36049dac4829f95c7f1ee2fa23)
- [Update games routes to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/dad93272f01a7855c07f35c94a1ab95e8036084c)
- [Escape quotes and backslashes in IGDB search queries.](https://github.com/fourjuaneight/query/commit/349b93d418c89b7ec2b320de5f3e03824b986d69)
- [Share in-flight Twitch token requests and retry IGDB calls once on 401.](https://github.com/fourjuaneight/query/commit/d356aca2323da119f40ab5f700278937f8543928)
- [Update manga routes to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/29c874a3b6820ac1f0f89cae371e9a2e3440ecd9)
- [Fetch manga details in one request and validate manga IDs.](https://github.com/fourjuaneight/query/commit/ac7c2fe3a9a24892624efaf17b388e11d8f0254b)
- [Update movie routes to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/78a3b6f358d7e319b58b15527d5cb732969200ae)
- [Update TV show routes to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/098bd9da296fb3b4617b71cdb9bfbb0649224f99)
- [Update MTG route to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/432b4524fcb0cf0bb8171a85b09bd3cf2ab06c36)
- [Send required Scryfall headers and encode the search query.](https://github.com/fourjuaneight/query/commit/0b50213647863e810d8400f56edb65c8b867448c)
- [Return empty results for Scryfall misses and surface rejected queries.](https://github.com/fourjuaneight/query/commit/b4705ec3d6d76a5d5b840c2a559739ad5e53a3a6)
- [**breaking**] [Keep MTG collector numbers as strings to preserve suffixes.](https://github.com/fourjuaneight/query/commit/65e3ef59e175e1fd4659cfebae149831f75db7fb)
- [Update music routes to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/9c83bed0ce7d937da22d33f77e96c32b67dc65b9)
- [Update Pokémon card route to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/bcc08260509ec58b77c6686ecfa4a6806efd7857)
- [**breaking**] [Paginate Pokémon card results to bound upstream detail requests.](https://github.com/fourjuaneight/query/commit/70b97b96f9df9abc5b7c74d0ca3d6ac058e0fd17)
- [Update repos routes to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/9d5d2882aa629878adacd0eb6296839fcd7f277e)
- [Look up owner/repo names directly and rank bare names by best match.](https://github.com/fourjuaneight/query/commit/e291672503ebe5e116380376a20752657d9051d6)
- [Update YouTube route to use shared fetch and param validation.](https://github.com/fourjuaneight/query/commit/b88c062a6900e2cc532e2922032b1e811963705f)
- [Parse YouTube video IDs from share, Shorts, embed, and live URLs.](https://github.com/fourjuaneight/query/commit/3fe5268489be382c3f1e49aae2c6e79408ff8258)
- [Restore the pnpm cache and read the Node version from .nvmrc in CI.](https://github.com/fourjuaneight/query/commit/8cec855df390ce50ea0eaa68522982bcbd03f21b)
- [Replace deprecated set-output and outdated actions in the changelog workflow.](https://github.com/fourjuaneight/query/commit/809044a76331eb63531bd8254d2c8dbaa6003ca8)
- [Replace the archived setup-git-cliff action with git-cliff-action.](https://github.com/fourjuaneight/query/commit/16b290563dec7424c100effd88fdd663bf720246)
- [Update GitHub Actions off the removed Node 20 runtime.](https://github.com/fourjuaneight/query/commit/7a6b0e6f6a5d6ffd18fc0acd83c86273555f5f61)
- [Harden the MCP server and OAuth sign-in after review.](https://github.com/fourjuaneight/query/commit/6f01e1863425c9e8a98c7a52e89498fec193dd9f)

### Documentation

- [Document error status codes.](https://github.com/fourjuaneight/query/commit/a388410668274451eddc1612e91239bfd904183d)
- [Document API key auth, rate limiting, and edge caching.](https://github.com/fourjuaneight/query/commit/32a4854d3d81c3520f162dec375da42df0cd9a38)
- [Document new query params and limits in the route reference.](https://github.com/fourjuaneight/query/commit/8ac799018818c1061b14e805ab584b431c07685d)
- [Update prerequisites and testing notes.](https://github.com/fourjuaneight/query/commit/17c576119644b27703441ff9bd7d24eab86e676b)
- [Add examples for new query params to the test data sheet.](https://github.com/fourjuaneight/query/commit/0954016106b26505a1f968393fc05949251b95a3)
- [Document the MCP server, OAuth setup and tool list.](https://github.com/fourjuaneight/query/commit/61d476b225fa5f81777f3f576900e82f8efd5146)
- [Update MCP setup, deploy and access-control notes.](https://github.com/fourjuaneight/query/commit/7f55a704abd3d0662bf2d583463b723d1471610b)
- [Add an HTTPS dev script for MCP sign-in in Safari.](https://github.com/fourjuaneight/query/commit/284bb44b9a67980f47ba85bb36435fdb6cb306a3)

### Features

- [Add shared upstream fetch and error response mapping.](https://github.com/fourjuaneight/query/commit/7fa55346dc568bb1c214918b429aaa9dbe5be744)
- [Add query param validation helpers.](https://github.com/fourjuaneight/query/commit/e91554fe39bcf9b5ebf1d62db3e7b3a842784d63)
- [Add movie IDs and a details=false option to movie search.](https://github.com/fourjuaneight/query/commit/7edd1dfb4426dabdc9d4fec01f673b993e683f97)
- [Add TV show IDs and a details=false option to TV show search.](https://github.com/fourjuaneight/query/commit/076d4f3749f602181271b5f730349baba98d2e12)
- [Add totalPages to repo search results.](https://github.com/fourjuaneight/query/commit/58ee21f7519f5857f5e2d2ea096372966a430443)
- [Add optional bearer token auth via the API_KEY secret.](https://github.com/fourjuaneight/query/commit/800981f79b8ced5656693fa15750e9add3750e6a)
- [Add per-IP rate limiting with the Workers Rate Limiting binding.](https://github.com/fourjuaneight/query/commit/907fbc02f1fbc909b1d42f359472e0696dd5c178)
- [Add a remote MCP server with OAuth sign-in.](https://github.com/fourjuaneight/query/commit/a4fc0d5971d26878a44aa38d786174d62a8dcd78)
- [Add Qobuz album search with store links.](https://github.com/fourjuaneight/query/commit/127cb1f1e7ef4393cd37bd5ad94c186d579debec)

### Miscellaneous Tasks

- [Update Changelog.](https://github.com/fourjuaneight/query/commit/127a12464189793f75a59e24a5cfd8d27f5f3280)
- [Bump hono and @hono/node-server to patch security advisories.](https://github.com/fourjuaneight/query/commit/49ecded4b6f2ca699b3e2576641e4d268b277826)
- [Set package type to module.](https://github.com/fourjuaneight/query/commit/38ce829cec40fadbd1730f6ff245ec090f01837f)
- [Use the local tsx binary for the dev:local script.](https://github.com/fourjuaneight/query/commit/07da00b09cdcf6574105e26f3960d3816ec0afcc)
- [Add typecheck script and split worker and Node tsconfigs.](https://github.com/fourjuaneight/query/commit/6843f4d795958422218588151cb41f7fbc0ff8b9)
- [Bump dev dependencies within their current ranges.](https://github.com/fourjuaneight/query/commit/42cf181729dc7fa272778964b1e665e00b7076cb)
- [Bump eslint and @eslint/js to v10.](https://github.com/fourjuaneight/query/commit/fec1014f50b1349398ec0bca57c3f653118d6f72)
- [Bump vitest and @vitest/coverage-v8 to v5.](https://github.com/fourjuaneight/query/commit/89c1a47f40541e284f25b3b0bfaf59532e0f2d24)
- [Bump @cloudflare/workers-types to v5.](https://github.com/fourjuaneight/query/commit/6078a50d31fc4b20e669b806893e3728562f2532)
- [Bump @hono/node-server to v2.](https://github.com/fourjuaneight/query/commit/b3b7ec9bc0f992ea01bba78c44c3929fb24ca80b)
- [Remove the unused build script and the esbuild and pnpm dev dependencies.](https://github.com/fourjuaneight/query/commit/8a66941e430476f62b762d2988aa23a4284e2683)
- [Update Node to v26.](https://github.com/fourjuaneight/query/commit/d6ab16fcd1f580d6a3792cb4fe6ac5aff81bcfd1)
- [Bump lint-staged to v17.](https://github.com/fourjuaneight/query/commit/e8af14b452af234c607bc92a0ea0def8d75f1839)
- [Update pnpm to v12 and approve esbuild and workerd build scripts.](https://github.com/fourjuaneight/query/commit/467ef9b145b82d67be664608bf4821a05a804c96)
- [Replace deprecated tseslint.config with ESLint defineConfig.](https://github.com/fourjuaneight/query/commit/65bed445c561349c04567bbe15524b7b33f4e758)
- [Ignore the local .wrangler state directory.](https://github.com/fourjuaneight/query/commit/541c0c864f9fd27968ca3c943d49a26bbe5cdb14)
- [Update Workers compatibility date to 2026-10-12.](https://github.com/fourjuaneight/query/commit/fc37258831a0cdffdcc9ab96279c60a39c81a911)
- [Add a concurrency group to the worker workflow.](https://github.com/fourjuaneight/query/commit/a93cb40b55a1a57b31243e1237be2d99f846d787)
- [Add a typecheck step to CI.](https://github.com/fourjuaneight/query/commit/35f0310a88762a4464c05e55e8a35f4e77078f4b)
- [Update Changelog.](https://github.com/fourjuaneight/query/commit/93aa5ba2fb0cd5ea3e0f36b3e5a8f00d52a90dd5)
- [Deny the OAuth provider's bundled agent skill in pnpm.](https://github.com/fourjuaneight/query/commit/d8e73d651f5339c23af624a6db1e9f51857b0046)
- [Add additional logging to wrangler.](https://github.com/fourjuaneight/query/commit/487c3d1635a341f543dde60f8f58378674823ece)
- [Update cloudflare token name.](https://github.com/fourjuaneight/query/commit/0600b8cfa0224a86c27c4ec4fc8288b1db37975d)

### Performance

- [Cache successful GET responses at the edge.](https://github.com/fourjuaneight/query/commit/52e85508a3299e3b3ff6c08a756bc4a43d976746)

### Refactor

- [Register route handlers directly.](https://github.com/fourjuaneight/query/commit/86f58b38d3e09ec4ce1fe676d31bb39fc3d7e725)

### Testing

- [Type JSON response bodies in tests.](https://github.com/fourjuaneight/query/commit/e15eb4b4330da79709c24f94365de7f76e794c95)

### Ci

- [Stop uploading secrets on every deploy.](https://github.com/fourjuaneight/query/commit/b6e39fdb9b3c7f725f505a6d7b2ac0ebfa57e281)

## [1.0.0] - 2026-02-25

### Bug Fixes

- [Add better error handling and logging on TMDB helper.](https://github.com/fourjuaneight/query/commit/0bc20691f44f18e5ed4e31843fe11ed9ade72ef2)
- [Remove unnecessary data from book results.](https://github.com/fourjuaneight/query/commit/06a587b6efa79ff04d14b3bb7413a73111abbb48)
- [Remove unnecessary manga results data.](https://github.com/fourjuaneight/query/commit/4c70e837eee37453ed4cfaa32a1ee852b4c4e313)
- [Update response data on queries to required info.](https://github.com/fourjuaneight/query/commit/d42dcf9427d24d8fc9cad231701fa5d12af4d659)
- [Update and strenghten typings across the board.](https://github.com/fourjuaneight/query/commit/e268ccbcc90f6825a47c0611a5fee01f42d10e8a)
- [Update linter and typescript config for more robutst safety.](https://github.com/fourjuaneight/query/commit/6326f91246e14872c7954871c00b6cbd30544338)
- [Update, fix, and optimize typing across the app.](https://github.com/fourjuaneight/query/commit/097222ea2726531751c2d7490dad5f5302ecc27a)
- [Update error handling for more consistency.](https://github.com/fourjuaneight/query/commit/a075a2d206a6756d16fd5685ad0caac911e8751b)
- [Update error handling for better predictability.](https://github.com/fourjuaneight/query/commit/3a9fb8a85dc311975872e4cf31eef90d441db0be)
- [Update books query with missing types.](https://github.com/fourjuaneight/query/commit/d40c084b9dc0c0e72cac04dbcc4b119669d189ef)
- [Update project to utilize Cloudflare's context for env variables.](https://github.com/fourjuaneight/query/commit/b521ff3d50c70cbb3271bda85a0c033f2f03103d)
- [Add missing data type from music query.](https://github.com/fourjuaneight/query/commit/68be7ced6730f49f618594199f5dec8653dbfa13)
- [Update games query to use twitch oauth for igdb auth token.](https://github.com/fourjuaneight/query/commit/569c22bfb98464925892df0e0199318e185b44eb)
- [Update GitHub PAT name to prevent clash with GH Actions.](https://github.com/fourjuaneight/query/commit/7abec880a10f4405c3d5b648118b30a6ac7c3217)
- [Update pnpm to correction version.](https://github.com/fourjuaneight/query/commit/4566138f9a10db4c4c36e784acb8b558f63ac5fa)
- [Update pnpm version.](https://github.com/fourjuaneight/query/commit/469384d6e3d8b59d8ad9d8fd82e8e633ea3eb343)

### Features

- [Add scryfall api wrapper.](https://github.com/fourjuaneight/query/commit/90723f6d7908da8dea6feaa5f137539c2fee33d3)
- [Add mangadex api wrapper.](https://github.com/fourjuaneight/query/commit/94b24ff0ab0b2e678ad0d120f8959e5e8da470a5)
- [Add TMDB helper to search of query of movies and tv shows data.](https://github.com/fourjuaneight/query/commit/3d75022ff28c41d8e90fca915a328b96ad23de2a)
- [Add mangadex search helper.](https://github.com/fourjuaneight/query/commit/a177ece74b9c658f4ba8ac4100be2dd297ba1949)
- [Update Scryfall helper to allow for name-only searches.](https://github.com/fourjuaneight/query/commit/ea7dfb8870e7df629563809735b8c00cd2ac818e)
- [Update and split TMDB query methods into movies and shows.](https://github.com/fourjuaneight/query/commit/de6ba5e0f83d9de50f2dd71c1c8f51f098d7f4e7)
- [Add OpenLibrary helper to search books.](https://github.com/fourjuaneight/query/commit/16a62aa7022f3a8e7a7ec81cb768abb9dafa94c3)
- [Add Discogs helper to search music.](https://github.com/fourjuaneight/query/commit/27a2d363ad22b2999599d559a2c178318176bfe6)
- [Add TCGdex helper to search Pokemon cards.](https://github.com/fourjuaneight/query/commit/0852886a8afafa8690625b84fea88734eef5631c)
- [Add IGDB helper to search video games.](https://github.com/fourjuaneight/query/commit/c640fda1a805a81e094df53e1bc754c2249a35bc)
- [Add GitHub helper to search repositories.](https://github.com/fourjuaneight/query/commit/81c992ff206baddb8920b972cb6e47af879b10f5)
- [Add Hono routing.](https://github.com/fourjuaneight/query/commit/a382b3d53f2db1853473d6e093c321a8d5c62382)
- [Add local server for testing.](https://github.com/fourjuaneight/query/commit/cc1d1985774460918b677bbb1e3fa7a8a8f616bc)
- [Add project documentation.](https://github.com/fourjuaneight/query/commit/fa478ff72df7813d737565a43bd1758d9c95daba)
- [Add YouTube helper to get video info.](https://github.com/fourjuaneight/query/commit/454ce03fec3dd4f59649dc088849f6c416a64eb8)
- [Add unit testing.](https://github.com/fourjuaneight/query/commit/cd95dd6bb09c19ec553faf91a9d09ddc50c678c5)
- [Add action to deploy worker to cloudflare.](https://github.com/fourjuaneight/query/commit/046b622d3afb289c799ae6ef44f210ca399f7996)
- [Add Cliff action to generate changelog.](https://github.com/fourjuaneight/query/commit/08c1743dfd78d492878ce6b8285c29e5e2f98bb7)

### Miscellaneous Tasks

- [Add pnpm config with needed dependencies.](https://github.com/fourjuaneight/query/commit/195dda6ed2e60393a31fa4aaab6b9cbefb47672f)
- [Add prettier and eslint configs.](https://github.com/fourjuaneight/query/commit/0fab9fdeddbc7f0e1b7d11f3bac2b956f4f653f0)
- [Add typescript config.](https://github.com/fourjuaneight/query/commit/690e2742c7ce8ca50383d4aee950fbda0b079691)
- [Add license.](https://github.com/fourjuaneight/query/commit/727473574b7a1b97ec558144869d058dd4276011)
- [Minor naming updates.](https://github.com/fourjuaneight/query/commit/6e9135de99437c29a23851173f0753a92a20d4f3)
- [Add doc links for TMDB helpers.](https://github.com/fourjuaneight/query/commit/d1c16682336011b89a07db83cce0a915bd8338f8)
- [Add standardized error logging.](https://github.com/fourjuaneight/query/commit/2ad024e791f96cde67a5d2ad906a5756cf0feef5)
- [Remove unnecessary examples on comments.](https://github.com/fourjuaneight/query/commit/84dd4c8e6aad922175a4d96da86d847fa6163f98)
- [Update catch blocks to use error logs instead.](https://github.com/fourjuaneight/query/commit/3ab1dbb7369f5187c49f98a17d1be3c1d934820c)
- [Update discogs responses to only return what's needed.](https://github.com/fourjuaneight/query/commit/9d143d25daaa0caabd4ed0c106d156cb3a35976d)
- [Update error log to match project pattern.](https://github.com/fourjuaneight/query/commit/0acc6e58d9b676610baec0740f468d38ba973bdc)
- [Update comments for easier parsing.](https://github.com/fourjuaneight/query/commit/d328d8925876cd999041988195cb99362f848972)
- [Add test data sheet for local testing.](https://github.com/fourjuaneight/query/commit/76245baaebbe359832dd74e588f3bafdcb0275f9)
- [Add wrangler config.](https://github.com/fourjuaneight/query/commit/1f5e1aa82c3ae69ba6bb520299da4ab53f940d59)
- [Add gitleaks for increased security.](https://github.com/fourjuaneight/query/commit/3d2796fb4b059906a280e438eaf46feb4bfd767a)
- [Bump hono from 4.11.4 to 4.11.10](https://github.com/fourjuaneight/query/commit/8016844c73d472d39625e1c635b918fc11b81179)
- [Bump pnpm from 10.28.1 to 10.28.2](https://github.com/fourjuaneight/query/commit/7b4bee2fea981f62246ad274a2702786dc392d23)
- [Minor formatting updates.](https://github.com/fourjuaneight/query/commit/11e560d5e2d3a3b0bc4f1250a393e49355c71206)
- [Update to v1.0.0.](https://github.com/fourjuaneight/query/commit/194a782242b62a581ae21e540a1cb6c7aa744921)
- [Update to v1.0.0.](https://github.com/fourjuaneight/query/commit/23cf6d1b29d06cb1da78c6e80a2f497056b34791)

<!-- generated by git-cliff -->
