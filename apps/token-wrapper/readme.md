# Token Wrapper

Token Wrapper is an Aragon app offering a checkpointed ERC20 token interface that is usable in Aragon Voting applications. Its purpose is to bridge external, "vanilla" ERC20 tokens to a checkpointed token.

Token holders of the outside token have the ability to wrap and unwrap their tokens to gain or decrease balance in this wrapped token.

## 🚨 Security review status: audited

The `TokenWrapper` contract was [last professionally audited in 2020-01](../../AUDIT.md).

This version was published to aragonPM as `token-wrapper.hatch.aragonpm.eth`.

## Caveats

In efforts to save gas costs and space to introduce the checkpointing, token amounts are limited to `uint192`. This should not pose a problem for any token, but as `uint192` supports a _very_ large range of numbers, but the TokenWrapper will stop accepting deposits once if it hits `2^192 - 1`.

## Installation Tutorial

**Prerequisites:** [aragonCLI](https://hack.aragon.org/docs/cli-intro) is needed to install the Token Wrapper into a DAO. Also note that you may have to change `--env aragon:rinkeby` for `--env aragon:mainnet` if the organization is on mainnet.

### 1. The first step is to install the Token Wrapper into your DAO:

```
dao install <DAO address> token-wrapper.hatch.aragonpm.eth --app-init-args <token address> <wrapped token name> <wrapped token symbol> --env aragon:rinkeby
```

The `token address` is the address of the ERC20 token you would like to "wrap" into an organizational token.

You can verify that the Token Wrapper app was installed into your organization with:

```sh
dao apps <DAO address> --all --env aragon:rinkeby
```

### 2. Next, create a permission for the TokenWrapper:

```sh
dao acl create <DAO address> <Token Wrapper app address> 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff <Voting app address> <Voting app address> --env aragon:rinkeby
```

You can get the installed Token Wrapper's address by listing the apps of your DAO with the following command:

```sh
dao apps <DAO address> --all --env aragon:rinkeby
```

At this point, you should be able to view the Token Wrapper app in the Aragon client. You can try it out by wrapping one of your tokens.


### 3. Then, create a new Voting app instance powered by your Token Wrapper:

```
dao install <DAO address> voting --app-init-args <Token Wrapper address> 500000000000000000 150000000000000000 604800 --env aragon:rinkeby
```

The command above uses the following voting parameters:

- `500000000000000000`: 50% minimum support
- `150000000000000000`: 15% minimum approval
- `604800`: Voting period of 7 days (604800 seconds)

### 4. And finally, create a permission for the new Voting app instance:

```
dao acl create <DAO address> <new Voting app address> CREATE_VOTES_ROLE <Token Wrapper address> <new Voting app address> --env aragon:rinkeby
```

This will let anyone who has wrapped at least one of their existing token to create a new vote, as well as vote in any open votes.
