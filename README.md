# Voting Connectors <img align="right" src="https://raw.githubusercontent.com/aragon/design/master/readme-logo.png" height="80px" />

This repository contains apps that serve as bridges to Aragon Voting apps requiring checkpointed balances (or any other app that requires checkpointed balances).

An Aragon Voting app requiring checkpointed balances expects the following interface to be implemented in its attached power source (usually a token or a contract that looks like one):

```solidity
// See shared/contract-utils/contracts/interfaces/IERC20WithCheckpointing.sol
contract IERC20WithCheckpointing {
    function balanceOf(address _owner) public view returns (uint256);
    function balanceOfAt(address _owner, uint256 _blockNumber) public view returns (uint256);

    function totalSupply() public view returns (uint256);
    function totalSupplyAt(uint256 _blockNumber) public view returns (uint256);
}
```

An example of one such Voting app is [aragon-apps/voting](https://github.com/aragon/aragon-apps/tree/master/apps/voting).

## Included apps

- **[Token Wrapper](apps/token-wrapper)**: Wrap external tokens into a checkpointed token.
- **[Voting Aggregator](apps/voting-aggregator)**: Aggregate voting power over multiple sources.

Each of the individual apps come with a frontend that is intended to be installed and used through the [Aragon client](http://github.com/aragon/aragon).

## 🚨 Security review status: audited

Each individual app may be audited at a different time, and past audits are documented in [AUDIT.md](./AUDIT.md).

## Quick start

```
npm install
```

This installs global package dependencies and also bootstraps the entire monorepo through [`lerna`](https://github.com/lerna/lerna).

> **Note**: the monorepo is set up in such a way that you **must** install it through a `lerna bootstrap` (done automatically after an `npm install`).
>
> If you're only interested in bootstrapping one package, you can use `npx lerna bootstrap --scope @aragon/<package> --include-filtered-dependencies`

Running tests on all apps can be done by running `npm run test` at the root directory (note that running all of the tests can take a significant amount of time!).

Running tests of an individual app can be done by running `npm run test` inside an individual app's directory, or through the selective `npm run test:<app>` scripts.

By default, tests are run on an in-memory instance of buidler.

## Contributing

For some introductory information on what an Aragon app is, and how to build one, please read through the [Aragon stack introduction](https://hack.aragon.org/docs/stack) and [Your first Aragon app](https://hack.aragon.org/docs/tutorial). The [aragonAPI documentation](https://hack.aragon.org/docs/api-intro) is also available as a reference.

#### 👋 Get started contributing with a [good first issue](https://github.com/aragonone/voting-connectors/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

Don't be shy to contribute even the smallest tweak. 🐲 There are still some dragons to be aware of, but we'll be here to help you get started!
