import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  ModalController,
  NavParams,
  AlertController,
  IonicModule,
} from "@ionic/angular";

import {
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class BackstagePage implements OnInit {
  backstageList: any;
  simSectionOpen = false;
  public MyRole: any = "visitor";
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

  async ngOnInit() {
    this.sourcePage = this.navParams.data["SourcePage"];
    this.MyRole = await this.toolService.getSecureStorage("myRole");
    // this.toolService.getSecureStorage("myRole").subscribe({
    //   next: async (result) => {
    //     this.MyRole = await result;
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
    this.getBackstage();
  }

  async getBackstage() {
    let userId = "";
    userId = await this.toolService.getSecureStorage("userId");
    // this.toolService.getSecureStorage("userId").subscribe({
    //   next: async (result) => {
    //     userId = await result;

        this.api.getData("api/backstage/" + userId).subscribe({
          next: async (result: any) => {
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
          error: (err: any) => {
            this.toolService.showAlertBasic(
              "Alerta",
              "Fallo obteniendo backstage: ",
              JSON.stringify(err),
              ["Ok"]
            );
          },
        });

      // }
      //,
      // error: (err) => {
      //   this.toolService.toastAlert(
      //     "error, obteniendo userId en getSecureStorage: " + err,
      //     0,
      //     ["Ok"],
      //     "middle"
      //   );
      // },
    // });
  }

  async getRoles() {
    let url = "api/roles/";
    if (this.sourcePage == "tab1NewNeighbor") {
      url = "api/roles/neiAdmin/";
    }

    let userId = await this.toolService.getSecureStorage("userId");
    // this.toolService.getSecureStorage("userId").subscribe({
    //   next: async (result) => {
    //     userId = await result;
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo userId en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

    this.api.getData(url + userId).subscribe({
      next: async (result: any) => {
        this.RoleList = await result;
      },
      error: (error: any) => {
        this.toolService.showAlertBasic(
          "Alerta",
          "Fallo, getRoles: ",
          JSON.stringify(error),
          ["Ok"]
        );
      },
    });
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
        sourcePage: page,
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
