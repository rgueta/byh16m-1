import { Routes } from "@angular/router";
import { TabsPage } from "./tabs.page";

export const routes: Routes = [
  {
    path: "tabs",
    component: TabsPage,
    children: [
      {
        path: "tab1",
        loadComponent: () =>
          import("../tab1/tab1.page").then((m) => m.Tab1Page),
      },
      {
        path: "tab2",
        loadComponent: () =>
          import("../tab2/tab2.page").then((m) => m.Tab2Page),
      },
      {
        path: "codes",
        loadComponent: () =>
          import("../pages/codes/codes.page").then((m) => m.CodesPage),
      },
      {
        path: "tab4",
        loadComponent: () =>
          import("../tab4/tab4.page").then((m) => m.Tab4Page),
      },
      {
        path: "admin",
        loadComponent: () =>
          import("../pages/admin/admin.page").then((m) => m.AdminPage),
      },
      {
        path: "",
        redirectTo: "/tabs/tab1",
        pathMatch: "full",
      },
    ],
  },
  {
    path: "",
    redirectTo: "/tabs/tab1",
    pathMatch: "full",
  },
];
