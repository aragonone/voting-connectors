import React from 'react'
import { useAragonApi } from '@aragon/api-react'
import { Main, Button } from '@aragon/ui'
import styled from 'styled-components'
import BN from 'bn.js'

function App() {
  const { api, appState } = useAragonApi()
  const {
    token,
    erc20,
    tokenBalance,
    erc20Balance,
    isSyncing
  } = appState

  // TODO: Read this from an input component
  const amount = '10000000'

  return (
    <Main>
      <BaseLayout>
        {isSyncing && <Syncing />}
        <Buttons>
          <Button mode="secondary" onClick={
            async () => {
              const app = (await api.currentApp().toPromise()).appAddress
              const intentParams = { token: { address: erc20, value: amount, spender: app } }
              await api.lock(amount, intentParams).toPromise()
            }
          }>
            Lock tokens
          </Button>
          <Button mode="secondary" onClick={
            async () => await api.unlock(amount).toPromise()
          }>
            Unlock tokens
          </Button>
        </Buttons>
        <div>
          <Count>Org token: {token} balance: {tokenBalance}</Count>
          <Count>Wrapped token: {erc20} balance: {erc20Balance}</Count>
        </div>
      </BaseLayout>
    </Main>
  )
}

const BaseLayout = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-direction: column;
`

const Count = styled.h1`
  font-size: 30px;
`

const Buttons = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 40px;
  margin-top: 20px;
`

const Syncing = styled.div.attrs({ children: 'Syncing…' })`
  position: absolute;
  top: 15px;
  right: 20px;
`

export default App
