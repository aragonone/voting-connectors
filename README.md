# Voting Connectors <img align="right" src="https://raw.githubusercontent.com/aragon/design/master/readme-logo.png" height="80px" />

## Apps

This repository contains the following apps that serve as bridges to Aragon Voting apps (or any
other app that requires checkpointed balances):

- **[Token Wrapper](apps/token-wrapper)**: Wrap external tokens to a checkpointed token.

Each of the individual apps come with a frontend that is intended to be installed and used through the [Aragon client](http://github.com/aragon/aragon).

## Quick start

```
npm install
```

This installs global package dependencies and also bootstraps the entire monorepo through [`lerna`](https://github.com/lerna/lerna).

> **Note**: the monorepo is set up in such a way that you **must** install it through a `lerna bootstrap` (done automatically after an `npm install`).
>
> If you're only interested in the contract dependencies, and not the frontends, you can use `INSTALL_FRONTEND=false npm install` instead.
>
> If you're only interested in bootstrapping one package, you can use `npx lerna bootstrap --scope @aragon/<package> --include-filtered-dependencies`

Running tests on all apps can be done by running `npm run test` at the root directory (note that running all of the tests can take a significant amount of time!).

Running tests of an individual app can be done by running `npm run test` inside an individual app's directory, or through the selective `npm run test:<app>` scripts.

By default, tests are run on an in-memory instance of testrpc.

## Contributing

For some introductory information on what an Aragon app is, and how to build one, please read through the [Aragon stack introduction](https://hack.aragon.org/docs/stack) and [Your first Aragon app](https://hack.aragon.org/docs/tutorial). The [aragonAPI documentation](https://hack.aragon.org/docs/api-intro) is also available as a reference.

#### 👋 Get started contributing with a [good first issue](https://github.com/aragonone/voting-connectors/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

Don't be shy to contribute even the smallest tweak. 🐲 There are still some dragons to be aware of, but we'll be here to help you get started!
