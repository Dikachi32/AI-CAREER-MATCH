import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CVProvider } from './context/CVContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UploadCV from './pages/UploadCV';
import JobRecommendations from './pages/JobRecommendations';
import SkillAnalytics from './pages/SkillAnalytics';
import AuthPage from './pages/AuthPage';
import HowItWorksPage from './pages/HowItWorksPage';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CVProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/about" element={<Layout><About /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
            <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
            <Route path="/" element={
              <PrivateRoute><Layout><Home /></Layout></PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
            } />
            <Route path="/upload" element={
              <PrivateRoute><Layout><UploadCV /></Layout></PrivateRoute>
            } />
            <Route path="/recommendations" element={
              <PrivateRoute><Layout><JobRecommendations /></Layout></PrivateRoute>
            } />
            <Route path="/skills" element={
              <PrivateRoute><Layout><SkillAnalytics /></Layout></PrivateRoute>
            } />
          </Routes>
        </CVProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;