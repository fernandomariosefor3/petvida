import { RouteObject } from 'react-router-dom';
import HomePage from '@/pages/home/page';
import RegistrationPage from '@/pages/registration/page';
import CheckoutSuccessPage from '@/pages/checkout-success/page';
import DashboardPage from '@/pages/dashboard/page';
import PetsPage from '@/pages/pets/page';
import PetDetailPage from '@/pages/pets/detail/page';
import RemindersPage from '@/pages/reminders/page';
import HealthPage from '@/pages/health/page';
import FaqPage from '@/pages/faq/page';
import AppLayout from '@/components/feature/AppLayout';
import PlanosPage from '@/pages/planos/page';
import NotFound from '@/pages/NotFound';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/register',
    element: <RegistrationPage />,
  },
  {
    path: '/checkout-success',
    element: <CheckoutSuccessPage />,
  },
  {
    path: '/faq',
    element: <FaqPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'pets', element: <PetsPage /> },
      { path: 'pets/:id', element: <PetDetailPage /> },
      { path: 'reminders', element: <RemindersPage /> },
      { path: 'health', element: <HealthPage /> },
      { path: 'planos', element: <PlanosPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
