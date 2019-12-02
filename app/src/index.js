import 'core-js/stable'
import 'regenerator-runtime/runtime'

import React from 'react'
import ReactDOM from 'react-dom'
import { AragonApi } from '@aragon/api-react'
import { Main } from '@aragon/ui'
import App from './App'

const reducer = state => {
  if (state === null) {
    return { syncing: true }
  }
  return state
}

ReactDOM.render(
  <AragonApi reducer={reducer}>
    <Main>
      <App />
    </Main>
  </AragonApi>,
  document.getElementById('root')
)
