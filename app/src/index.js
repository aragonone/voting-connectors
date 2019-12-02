import 'core-js/stable'
import 'regenerator-runtime/runtime'

import React from 'react'
import ReactDOM from 'react-dom'
import { Main } from '@aragon/ui'
import App from './App'

ReactDOM.render(
  <Main>
    <App />
  </Main>,
  document.getElementById('root')
)
