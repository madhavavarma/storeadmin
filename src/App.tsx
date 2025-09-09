import { Route, Routes, HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/Store'
import './App.css'


import AppSidebar from './pages/Layout/AppSitebar'
import Orders from './pages/Orders/Orders'
import Categories from './pages/Categories/Categories'
import Header from './components/Header'
import { useState, useCallback } from 'react';


export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleAuthSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);
  return (
    <Provider store={store}>
  <HashRouter>
        <div className="flex min-h-screen">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Header onAuthSuccess={handleAuthSuccess} />
            <main className="flex-1 bg-zinc-50 dark:bg-zinc-900 max-w-[100%]">
              <Routes>
                <Route path="/orders" element={<Orders refreshKey={refreshKey} />} />
                <Route path="/categories" element={<Categories refreshKey={refreshKey} />} />
                {/* Add more routes here as needed */}
              </Routes>
            </main>
          </div>
        </div>
  </HashRouter>
    </Provider>
  );
}

