import { Component, EnvironmentInjector, inject, OnInit } from "@angular/core";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  settingsOutline,
  peopleOutline,
  keyOutline,
  timeOutline,
  homeOutline,
} from "ionicons/icons";
import { ToolsService } from "../services/tools.service";

@Component({
  selector: "app-tabs",
  templateUrl: "tabs.page.html",
  styleUrls: ["tabs.page.scss"],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon],
})
export class TabsPage implements OnInit {
  MyRole: any | null = "visitor";
  public environmentInjector = inject(EnvironmentInjector);

  constructor(private toolService: ToolsService) {
    addIcons({
      settingsOutline,
      peopleOutline,
      keyOutline,
      timeOutline,
      homeOutline,
    });
  }

  async ngOnInit() {

    this.MyRole = await this.toolService.getSecureStorage("myRole");
    // this.toolService.getSecureStorage("myRole").subscribe({
    //   next: (result) => {
    //     this.MyRole = result || "visitor";
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo myRole en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });
  }
}
