import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CVProvider } from './context/CVContext';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UploadCV from './pages/UploadCV';
import JobRecommendations from './pages/JobRecommendations';
import JobDetails from './pages/JobDetails';
import SkillAnalytics from './pages/SkillAnalytics';
import AuthPage from './pages/AuthPage';
import HowItWorksPage from './pages/HowItWorksPage';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SavedJobs from './pages/SavedJobs';
import Settings from './pages/Settings';
// Phase 5: AI Interview Copilot
import InterviewCopilot from './pages/InterviewCopilot';
// Phase 6: AI Career Coach Dashboard
import CareerDashboard from './pages/CareerDashboard';


function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <CVProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
                  <Route path="how-it-works" element={<HowItWorksPage />} />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="privacy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<TermsOfService />} />
                  <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="upload" element={<PrivateRoute><UploadCV /></PrivateRoute>} />
                  <Route path="recommendations" element={<PrivateRoute><JobRecommendations /></PrivateRoute>} />
                  <Route path="job/:jobId" element={<PrivateRoute><JobDetails /></PrivateRoute>} />
                  <Route path="skills" element={<PrivateRoute><SkillAnalytics /></PrivateRoute>} />
                  <Route path="saved-jobs" element={<PrivateRoute><SavedJobs /></PrivateRoute>} />
                  <Route path="settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  {/* Phase 5: AI Interview Copilot */}
                  <Route path="interview-copilot" element={<PrivateRoute><InterviewCopilot /></PrivateRoute>} />
                  {/* Phase 6: AI Career Coach Dashboard */}
                  <Route path="career-dashboard" element={<PrivateRoute><CareerDashboard /></PrivateRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Router>
          </CVProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;