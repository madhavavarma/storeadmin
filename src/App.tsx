import { Route, Routes, HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/Store'
import './App.css'


import AppSidebar from './pages/Layout/AppSitebar'
import Orders from './pages/Orders/Orders'
import Categories from './pages/Categories/Categories'
import Settings from './pages/Settings'
import Header from './components/Header'
import { useState, useCallback } from 'react';
import Dashboard from './pages/Dashboard/Dashboard'
import Customers from './pages/Customers'


export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleAuthSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);
  return (
    <Provider store={store}>
  <HashRouter>
        <div className="flex min-h-screen">
          <AppSidebar refreshKey={refreshKey} />
          <div className="flex-1 flex flex-col">
            <Header onAuthSuccess={handleAuthSuccess} />
            <main className="flex-1 bg-zinc-50 dark:bg-zinc-900 max-w-[100%]">
              <Routes>
                <Route path="/dashboard" element={<Dashboard key={refreshKey} />} />
                <Route path="/orders" element={<Orders refreshKey={refreshKey} />} />
                <Route path="/categories" element={<Categories refreshKey={refreshKey} />} />
                <Route path="/settings" element={<Settings refreshKey={refreshKey} />} />
                <Route path="/customers" element={<Customers refreshKey={refreshKey} />} />
                {/* Add more routes here as needed */}
                <Route path="*" element={<Dashboard key={refreshKey} />} />
              </Routes>
            </main>
          </div>
        </div>
  </HashRouter>
    </Provider>
  );
}

