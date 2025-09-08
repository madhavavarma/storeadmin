import './App.css'
import { SidebarProvider } from './components/ui/sidebar'
import AppSidebar from './pages/Layout/AppSitebar'


function App() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-gray-50">
          {/* Your main content goes here */}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default App
