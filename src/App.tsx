import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/Store'
import './App.css'
import AppSidebar from './pages/Layout/AppSitebar'
import Orders from './pages/Orders/Orders'


export default function App() {
  return (
    <Provider store={store}>
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
    </Provider>
  );
}

