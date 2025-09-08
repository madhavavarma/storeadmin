import { Route, Routes, HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/Store'
import './App.css'

import AppSidebar from './pages/Layout/AppSitebar'
import Orders from './pages/Orders/Orders'
import Header from './components/Header'


export default function App() {
  return (
    <Provider store={store}>
  <HashRouter>
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 bg-zinc-50 dark:bg-zinc-900 max-w-[100%]">
              <Routes>
                <Route path="/orders" element={<Orders />} />
                {/* Add more routes here as needed */}
              </Routes>
            </main>
          </div>
        </div>
  </HashRouter>
    </Provider>
  );
}

