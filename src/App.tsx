import { Route, Routes, BrowserRouter, HashRouter } from 'react-router-dom'
import './App.css'
import AppSidebar from './pages/Layout/AppSitebar'
import Orders from './pages/Orders/Orders'


export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-gray-50 max-w-[100%]">
          <Routes>
            <Route path="/orders" element={<Orders />} />
            {/* Add more routes here as needed */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

