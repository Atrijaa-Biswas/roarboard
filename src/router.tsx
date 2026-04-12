import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AttendeeView from './pages/AttendeeView';
import StaffDashboard from './pages/StaffDashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AuthProvider from './components/shared/AuthProvider';
import AuthGuard from './components/shared/AuthGuard';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AttendeeView />,
    errorElement: <NotFound />,
  },
  {
    path: '/staff',
    element: (
      <AuthGuard>
        <StaffDashboard />
      </AuthGuard>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
]);

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
