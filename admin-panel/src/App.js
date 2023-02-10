import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query'
import './App.css';
import Router from './routes';
import WalletContext from './context/WalletContext'
import { useMoralis } from 'react-moralis';

const queryClient = new QueryClient()

function App() {
  const [walletAddress, setWalletAddress] = useState()
  const { isInitialized, isWeb3Enabled, enableWeb3 } = useMoralis()
  
  useEffect(() => {
    (async () => {
      if (isInitialized && !isWeb3Enabled ) {
        enableWeb3({ chainId: 250 })
      }
    }) ()
  }, [enableWeb3, isInitialized, isWeb3Enabled])

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <Router />
        </div>
      </QueryClientProvider>
    </WalletContext.Provider>
  );
}

export default App;
