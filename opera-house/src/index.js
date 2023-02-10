import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { MoralisProvider } from "react-moralis";

ReactDOM.render(
  <MoralisProvider appId="TuS0Np7a0s5DeDZ0CbgOM796MnPm6SKl2tyHVxoS" serverUrl="https://dkegezgeevia.usemoralis.com:2053/server">
    <App />
  </MoralisProvider>,
  document.getElementById('root')
);
