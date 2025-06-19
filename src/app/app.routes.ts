import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'users',
    loadComponent: () => import('./modals/users/users.page').then( m => m.UsersPage)
  },
  {
    path: 'visitor-list',
    loadComponent: () => import('./modals/visitor-list/visitor-list.page').then( m => m.VisitorListPage)
  },
  {
    path: 'family',
    loadComponent: () => import('./modals/family/family.page').then( m => m.FamilyPage)
  },
  {
    path: 'requests',
    loadComponent: () => import('./modals/requests/requests.page').then( m => m.RequestsPage)
  },
  {
    path: 'upd-users',
    loadComponent: () => import('./modals/upd-users/upd-users.page').then( m => m.UpdUsersPage)
  },
  {
    path: 'backstage',
    loadComponent: () => import('./modals/backstage/backstage.page').then( m => m.BackstagePage)
  },
];
