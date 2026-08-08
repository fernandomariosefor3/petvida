import { lazy } from 'react';
import AdminPage from '@/pages/admin/page';
import { RouteObject } from 'react-router-dom';
import HomePage from '@/pages/home/page';
import RegistrationPage from '@/pages/registration/page';
import GuestPetPage from '@/pages/guest-pet/page';
import SosPublicPage from '@/pages/sos-public/page';
import CheckoutSuccessPage from '@/pages/checkout-success/page';
import DashboardPage from '@/pages/dashboard/page';
import PetsPage from '@/pages/pets/page';
import PetDetailPage from '@/pages/pets/detail/page';
import RemindersPage from '@/pages/reminders/page';
import HealthPage from '@/pages/health/page';
import FaqPage from '@/pages/faq/page';
import AppLayout from '@/components/feature/AppLayout';
import PlanosPage from '@/pages/planos/page';
import BillingPage from '@/pages/billing/page';
import NotificationSettingsPage from '@/pages/settings/notifications/page';
import NotFound from '@/pages/NotFound';

// Leaflet (~150kB) is only needed on this one page — lazy-loaded so it never lands in the main bundle for everyone else.
const ServicesPage = lazy(() => import('@/pages/services/page'));

const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/register', element: <RegistrationPage /> },
  { path: '/carteirinha-teste', element: <GuestPetPage /> },
  { path: '/p/:publicSosId', element: <SosPublicPage /> },
  { path: '/checkout-success', element: <CheckoutSuccessPage /> },
  { path: '/faq', element: <FaqPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'pets', element: <PetsPage /> },
      { path: 'pets/:id', element: <PetDetailPage /> },
      { path: 'reminders', element: <RemindersPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'planos', element: <PlanosPage /> },
      { path: 'billing', element: <BillingPage /> },
      { path: 'settings/notifications', element: <NotificationSettingsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
];

export default routes;
