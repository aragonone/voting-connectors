#!/usr/bin/env bash

# MODE is 'ipfs' or 'http'
MODE=$1
echo RUNNING APP IN MODE: \"$MODE\"

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the RPC instance that we started (if we started one and if it's still running).
  if [ -n "$pid" ] && ps -p $pid > /dev/null; then
    kill -9 $pid
  fi
}

startDevchain() {
  echo Starting devchain...
  npx aragon devchain --verbose > /dev/null &
  pid=$!
  sleep 3
  echo \ \ Running devchain with pid ${pid}
}

deployTokens() {
  echo Deploying token...
  WRAPPED_TOKEN=$(npx truffle exec scripts/deployToken.js 'WrappedToken' 'DAI' --network rpc | tail -1)
  echo \ \ Wrapped token: ${WRAPPED_TOKEN}
}

run() {
  echo Running org...
  if [ $MODE == 'ipfs' ]
  then runUsingIPFS
  elif [ $MODE == 'http' ]
  then runUsingHTTP
  else
    echo ERROR: Unrecognized mode \"$MODE\". Please use 'ipfs' or 'http'.
  fi
}

runUsingIPFS() {
  npx aragon run --debug --files dist --template Template --template-init @ARAGON_ENS --template-new-instance newInstance --template-args ${WRAPPED_TOKEN} --env default
}

runUsingHTTP() {
  npx aragon run --debug --http localhost:8001 --http-served-from ./dist --template Template --template-init @ARAGON_ENS --template-new-instance newInstance --template-args ${WRAPPED_TOKEN} --env default
}

startDevchain
deployTokens
run
