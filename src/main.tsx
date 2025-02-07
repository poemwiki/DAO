import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { ApolloClient, InMemoryCache, ApolloProvider, from, HttpLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { web3Onboard } from './config/web3'
import { config } from './config'
import App from './App'
import './i18n'
import './index.css'

// Log any GraphQL errors or network error that occurred
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    )
  if (networkError) console.error(`[Network error]: ${networkError}`)
})

const httpLink = new HttpLink({
  uri: config.api.baseUrl,
})

const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
  connectToDevTools: true, // Enable Apollo dev tools
})

// Log the configuration
console.log('App configuration:', {
  baseUrl: config.api.baseUrl,
  daoName: config.app.name,
  network: config.network,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ApolloProvider client={apolloClient}>
        <Web3OnboardProvider web3Onboard={web3Onboard}>
          <App />
        </Web3OnboardProvider>
      </ApolloProvider>
    </BrowserRouter>
  </React.StrictMode>
)
