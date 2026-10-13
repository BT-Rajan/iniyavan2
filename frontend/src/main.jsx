import {createRoot} from 'react-dom/client'; import App from './App.jsx'
import {I18nProvider} from './i18n/index.jsx'
createRoot(document.getElementById('root')).render(<I18nProvider><App/></I18nProvider>)
if('serviceWorker' in navigator&&import.meta.env.PROD)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))
