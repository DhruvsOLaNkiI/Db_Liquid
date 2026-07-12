import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ListingsProvider } from './context/ListingsContext';
import { ScrollToTop } from './components/ScrollToTop';
import { AdminRoute } from './components/AdminRoute';

// Eager: only what login/signup need for a fast first paint
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Lazy: load page code only when the route is visited (not on /login)
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const PrototypePage = lazy(() =>
  import('./pages/PrototypePage').then((m) => ({ default: m.PrototypePage })),
);
const ListPropertyLoginPage = lazy(() =>
  import('./pages/ListPropertyLoginPage').then((m) => ({ default: m.ListPropertyLoginPage })),
);
const ListYourPropertyPage = lazy(() =>
  import('./pages/ListYourPropertyPage').then((m) => ({ default: m.ListYourPropertyPage })),
);
const BrowsePropertyPage = lazy(() =>
  import('./pages/BrowsePropertyPage').then((m) => ({ default: m.BrowsePropertyPage })),
);
const PropertyBidPage = lazy(() =>
  import('./pages/PropertyBidPage').then((m) => ({ default: m.PropertyBidPage })),
);
const SellerDashboardPage = lazy(() =>
  import('./pages/SellerDashboardPage').then((m) => ({ default: m.SellerDashboardPage })),
);
const DealChatPage = lazy(() =>
  import('./pages/DealChatPage').then((m) => ({ default: m.DealChatPage })),
);
const SellerChatPage = lazy(() =>
  import('./pages/SellerChatPage').then((m) => ({ default: m.SellerChatPage })),
);
const EditListingPage = lazy(() =>
  import('./pages/EditListingPage').then((m) => ({ default: m.EditListingPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const VerificationDashboardPage = lazy(() =>
  import('./pages/VerificationDashboardPage').then((m) => ({
    default: m.VerificationDashboardPage,
  })),
);
const HowItWorksPage = lazy(() =>
  import('./pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })),
);
const FAQPage = lazy(() => import('./pages/FAQPage').then((m) => ({ default: m.FAQPage })));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white/70">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ListingsProvider>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/prototype" element={<PrototypePage />} />
              <Route path="/prototype/users" element={<UsersPage />} />
              <Route
                path="/admin/verification"
                element={
                  <AdminRoute>
                    <VerificationDashboardPage />
                  </AdminRoute>
                }
              />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/list-your-property" element={<ListPropertyLoginPage />} />
              <Route path="/list-your-property/create" element={<ListYourPropertyPage />} />
              <Route path="/browse-property" element={<BrowsePropertyPage />} />
              <Route path="/browse-property/:id" element={<PropertyBidPage />} />
              <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
              <Route path="/seller/listing/:id/edit" element={<EditListingPage />} />
              <Route path="/seller/chat/:id" element={<SellerChatPage />} />
              <Route path="/deal/:id/chat" element={<DealChatPage />} />
            </Routes>
          </Suspense>
        </ListingsProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
