import '@/styles/globals.css';
import 'azure-maps-control/dist/atlas.min.css';

import type { AppProps } from 'next/app';

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

export default App;
