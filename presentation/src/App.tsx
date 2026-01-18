import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { StockDetail } from './pages/StockDetail';
import { PortfolioDashboard } from './pages/PortfolioDashboard';
import { PortfolioDetail } from './pages/PortfolioDetail';
import { Navbar } from './components/layout/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-dvh bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/portfolios" element={<PortfolioDashboard />} />
            <Route path="/portfolios/:id" element={<PortfolioDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;