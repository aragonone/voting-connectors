# Token Wrapper

Token Wrapper is an Aragon app offering a checkpointed ERC20 token interface that is usable in Aragon Voting applications. Its purpose is to bridge external, "vanilla" ERC20 tokens to a checkpointed token.

Token holders of the outside token have the ability to wrap and unwrap their tokens to gain or decrease balance in this wrapped token.

## 🚨 Not yet audited, use at your own risk

The `TokenWrapper` contract has not yet been professionally audited. It is relatively simple, but use with this asterisk in mind.

## Caveats

In efforts to save gas costs and space to introduce the checkpointing, token amounts are limited to `uint192`. This should not pose a problem for any token, but as `uint192` supports a _very_ large range of numbers, but the TokenWrapper will stop accepting deposits once if it hits `2^192 - 1`.

## How to install

**Prerequisites:** [aragonCLI](https://hack.aragon.org/docs/cli-intro) is needed to install the TokenWrapper to a DAO. Also note that you may have to change `--env aragon:rinkeby`  for  `--env aragon:mainnet` in case the organization is on mainnet.


### 1. The first step is to install the app to your DAO: 

```
dao install <DAO address> token-wrapper.hatch.aragonpm.eth --app-init-args <Token address> <Wrapped token name> <Wrapped token symbol> --env aragon:rinkeby
```

This will install the new app that acts as a Minime token.


### 2. Next, create a permission for the TokenWrapper:

```
dao acl create <dao address> <token-wrapper address> ROLE <voting app address> <voting app address> --env aragon:rinkeby
``` 
You can get the token-wrapper address by listing the apps of your DAO with the following command: 
```
dao apps <dao address> --all --env aragon:rinkeby
```
At this point, you should be able to view the TokenWrapper app in the frontend. You can try it out by wrapping one of your tokens.

### 3. Then, create a new voting app instance linked to your wrapped tokens:
```
dao install <dao address> voting --app-init-args <token-wrapper address> 500000000000000000 150000000000000000 604800 --env aragon:rinkeby
```

### 4. And finally, create a permission for the new Voting app instance:
```
dao acl create <dao address> <new voting app address> CREATE_VOTES_ROLE <token-wrapper address> <new voting app address> --env aragon:rinkeby
```
This will basically let anyone who has wrapped one of their existing ERC-20 token to create a new vote.