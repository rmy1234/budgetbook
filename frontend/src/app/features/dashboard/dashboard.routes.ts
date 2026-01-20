import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./transactions/transactions.component').then(m => m.TransactionsComponent)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./accounts/accounts.component').then(m => m.AccountsComponent)
      },
      {
        path: 'statistics',
        loadComponent: () => import('./statistics/statistics.component').then(m => m.StatisticsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent)
      }
    ]
  }
];
