import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './app/styles/index.scss';
import '@radix-ui/themes/styles.css';
import { Provider } from 'react-redux';
import { StoreProvider } from './app/providers/ui/StoreProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <StoreProvider>
            <App />
        </StoreProvider>
    </React.StrictMode>
);
