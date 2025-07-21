import { Component, EnvironmentInjector, inject } from "@angular/core";
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
export class TabsPage {
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

  async ionViewWillEnter() {
    this.MyRole = this.toolService.getSecureStorage("myRole");
  }
}
