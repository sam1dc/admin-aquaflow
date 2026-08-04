import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Cisterneros } from './pages/Cisterneros';
import { Tarifas } from './pages/Tarifas';
import { Promociones } from './pages/Promociones';
import { Pedidos } from './pages/Pedidos';
import { Pagos } from './pages/Pagos';
import { Incidencias } from './pages/Incidencias';
import { Usuarios } from './pages/Usuarios';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'pedidos',
        element: <Pedidos />,
      },
      {
        path: 'cisterneros',
        element: <Cisterneros />,
      },
      {
        path: 'pagos',
        element: <Pagos />,
      },
      {
        path: 'tarifas',
        element: <Tarifas />,
      },
      {
        path: 'promociones',
        element: <Promociones />,
      },
      {
        path: 'incidencias',
        element: <Incidencias />,
      },
      {
        path: 'usuarios',
        element: <Usuarios />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      }
    ],
  },
]);
