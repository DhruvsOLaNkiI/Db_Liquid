import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ListingsProvider } from './context/ListingsContext';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { PrototypePage } from './pages/PrototypePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ListPropertyLoginPage } from './pages/ListPropertyLoginPage';
import { ListYourPropertyPage } from './pages/ListYourPropertyPage';
import { BrowsePropertyPage } from './pages/BrowsePropertyPage';
import { PropertyBidPage } from './pages/PropertyBidPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { DealChatPage } from './pages/DealChatPage';
import { SellerChatPage } from './pages/SellerChatPage';
import { EditListingPage } from './pages/EditListingPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsersPage } from './pages/UsersPage';
import { VerificationDashboardPage } from './pages/VerificationDashboardPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { FAQPage } from './pages/FAQPage';

export default function App() {
  return (
    <AuthProvider>
      <ListingsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/prototype" element={<PrototypePage />} />
            <Route path="/prototype/users" element={<UsersPage />} />
            <Route path="/admin/verification" element={<VerificationDashboardPage />} />
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
        </BrowserRouter>
      </ListingsProvider>
    </AuthProvider>
  );
}
