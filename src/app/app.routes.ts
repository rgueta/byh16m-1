import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "",
    loadChildren: () => import("./tabs/tabs.routes").then((m) => m.routes),
  },
  {
    path: "users",
    loadComponent: () =>
      import("./modals/users/users.page").then((m) => m.UsersPage),
  },
  {
    path: "visitor-list",
    loadComponent: () =>
      import("./modals/visitor-list/visitor-list.page").then(
        (m) => m.VisitorListPage
      ),
  },
  {
    path: "family",
    loadComponent: () =>
      import("./modals/family/family.page").then((m) => m.FamilyPage),
  },
  {
    path: "requests",
    loadComponent: () =>
      import("./modals/requests/requests.page").then((m) => m.RequestsPage),
  },
  {
    path: "upd-users",
    loadComponent: () =>
      import("./modals/upd-users/upd-users.page").then((m) => m.UpdUsersPage),
  },
  {
    path: "backstage",
    loadComponent: () =>
      import("./modals/backstage/backstage.page").then((m) => m.BackstagePage),
  },
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login/login.page").then((m) => m.LoginPage),
  },
  {
    path: "codes",
    loadComponent: () =>
      import("./pages/codes/codes.page").then((m) => m.CodesPage),
  },
  {
    path: "upd-codes-modal",
    loadComponent: () =>
      import("./modals/upd-codes-modal/upd-codes-modal.page").then(
        (m) => m.UpdCodesModalPage
      ),
  },
  {
    path: "visitors",
    loadComponent: () =>
      import("./modals/visitors/visitors.page").then((m) => m.VisitorsPage),
  },
  {
    path: "admin",
    loadComponent: () =>
      import("./pages/admin/admin.page").then((m) => m.AdminPage),
  },
  {
    path: "upd-cores",
    loadComponent: () =>
      import("./modals/upd-cores/upd-cores.page").then((m) => m.UpdCoresPage),
  },
  {
    path: "upd-cpus",
    loadComponent: () =>
      import("./modals/upd-cpus/upd-cpus.page").then((m) => m.UpdCpusPage),
  },
  {
    path: "info",
    loadComponent: () =>
      import("./modals/info/info.page").then((m) => m.InfoPage),
  },
  {
    path: "contacts",
    loadComponent: () =>
      import("./modals/contacts/contacts.page").then((m) => m.ContactsPage),
  },
  {
    path: "visitor-list",
    loadComponent: () =>
      import("./modals/visitor-list/visitor-list.page").then(
        (m) => m.VisitorListPage
      ),
  },
  {
    path: "users",
    loadComponent: () =>
      import("./modals/users/users.page").then((m) => m.UsersPage),
  },
];
