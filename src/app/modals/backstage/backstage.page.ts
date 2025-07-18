import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ModalController, NavParams, AlertController } from "@ionic/angular";
import {
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from "@ionic/angular/standalone";

import { DatabaseService } from "../../services/database.service";
import { UpdUsersPage } from "../../modals/upd-users/upd-users.page";

import { ToolsService } from "../../services/tools.service";

import { addIcons } from "ionicons";
import {
  arrowBackCircleOutline,
  chevronForwardOutline,
  chevronDownOutline,
  send,
} from "ionicons/icons";

@Component({
  selector: "app-backstage",
  templateUrl: "./backstage.page.html",
  styleUrls: ["./backstage.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonItem,
    IonLabel,
    IonFab,
    IonLabel,
    IonIcon,
    IonList,
    IonButtons,
    IonRefresherContent,
    IonRefresher,
    IonFabButton,
    ReactiveFormsModule,
  ],
})
export class BackstagePage implements OnInit {
  backstageList: any;
  simSectionOpen = false;
  public MyRole: string = "visitor";
  sourcePage: string = "";
  RoleList: any = [];

  constructor(
    private modalController: ModalController,
    private api: DatabaseService,
    public alertCtrl: AlertController,
    private toolService: ToolsService,
    private navParams: NavParams
  ) {
    addIcons({
      arrowBackCircleOutline,
      chevronForwardOutline,
      chevronDownOutline,
      send,
    });
  }

  async ionViewWillEnter() {
    this.MyRole = localStorage.getItem("my-role")!;
  }

  ngOnInit() {
    this.sourcePage = this.navParams.data["SourcePage"];
    this.getBackstage();
  }

  async getBackstage() {
    this.api
      .getData("api/backstage/" + localStorage.getItem("my-userId"))
      .subscribe(
        async (result: any) => {
          this.backstageList = await result;
          if (this.backstageList.length > 0) {
            this.backstageList[0].open = true;
          } else {
            this.toolService.showAlertBasic(
              "",
              "No hay usuarios por agregar",
              "",
              ["Ok"]
            );
            this.modalController.dismiss("no refresh");
          }
        },
        (err: any) => {
          this.toolService.showAlertBasic(
            "Alerta",
            "Error, get backstage: ",
            JSON.stringify(err),
            ["Ok"]
          );
        }
      );
  }

  async getRoles() {
    let url = "api/roles/";
    if (this.sourcePage == "tab1NewNeighbor") {
      url = "api/roles/neiAdmin/";
    }
    this.api.getData(url + localStorage.getItem("my-userId")).subscribe(
      async (result: any) => {
        this.RoleList = await result;
      },
      (error: any) => {
        this.toolService.showAlertBasic(
          "Alerta",
          "Error, getRoles: ",
          JSON.stringify(error),
          ["Ok"]
        );
      }
    );
  }

  toggleSection(index: number) {
    this.backstageList[index].open = !this.backstageList[index].open;
    if (this.backstageList && this.backstageList[index].open) {
      this.backstageList
        .filter((item: {}, itemIndex: number) => itemIndex != index)
        .map((item: any) => (item.open = false));
    }
  }

  async doRefresh(event: any) {
    this.getBackstage();

    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  async addUser(pkg: any) {
    let page = "tab1NewNeighbor";
    if (this.MyRole == "admin") {
      page = "admin";
    }

    const modal = await this.modalController.create({
      component: UpdUsersPage,
      componentProps: {
        SourcePage: page,
        pkg: pkg,
      },
    });

    await modal.present();

    await modal.onDidDismiss().then(async (res) => {
      if (res.data == "refresh") {
        this.getBackstage();
      }
    });
  }

  closeModal() {
    this.modalController.dismiss("no refresh");
  }
}
