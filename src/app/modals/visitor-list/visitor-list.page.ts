import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  AlertController,
  ModalController,
  IonIcon,
  IonLabel,
  IonItem,
  IonList,
  IonFabButton,
  IonFab,
  IonButtons,
} from "@ionic/angular/standalone";
import { VisitorsPage } from "../visitors/visitors.page";
import { Contacts } from "@capacitor-community/contacts";
import { addIcons } from "ionicons";
import {
  trashOutline,
  addOutline,
  arrowBackCircleOutline,
} from "ionicons/icons";
import { ToolsService } from "../../services/tools.service";

@Component({
  selector: "app-visitor-list",
  templateUrl: "./visitor-list.page.html",
  styleUrls: ["./visitor-list.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    CommonModule,
    FormsModule,
    IonIcon,
    IonLabel,
    IonList,
    IonFabButton,
    IonFab,
    IonButtons,
  ],
})
export class VisitorListPage implements OnInit {
  myVisitors: any = [];
  selectedVisitor: {} = {};
  permission: any;

  constructor(
    private modalController: ModalController,
    private alertController: AlertController,
    private toolService: ToolsService
  ) {
    addIcons({ trashOutline, addOutline, arrowBackCircleOutline });
  }

  async ngOnInit() {
    //   getting visitors ---------------------------
    this.myVisitors = await this.toolService.getSecureStorage("visitors");

    // this.toolService.getSecureStorage("visitors").subscribe({
    //   next: (result) => {
    //     this.myVisitors = JSON.parse(result);
    //   },
    //   error: (err) => {
    //     this.toolService.toastAlert(
    //       "error, obteniendo visitors en getSecureStorage: " + err,
    //       0,
    //       ["Ok"],
    //       "middle"
    //     );
    //   },
    // });

    this.getVisitors();
    // this.getContacts();
  }

  async getContacts() {
    try {
      const permission = await Contacts.requestPermissions();
      this.permission = permission;

      console.log("Contact permission -->", permission);
    } catch (e) {
      console.log(e);
    }
  }

  async getVisitors() {
    //Sort Visitors by name
    if (this.myVisitors.length > 1) {
      this.myVisitors = await this.toolService.sortJsonVisitors(
        this.myVisitors,
        "name",
        true
      );
    }
  }

  toggleSection(item: {}) {
    this.selectedVisitor = item;
    this.closeModal();
  }

  deleteVisitor(index: number, item: any) {
    console.log(this.myVisitors);
    console.log(`delete --> ${index} `, item);
  }

  async addVisitor() {
    const modal = await this.modalController.create({
      component: VisitorsPage,
    });

    modal.onDidDismiss().then(async (item) => {
      if (item.data) {
        //Sort Visitors by name
        this.myVisitors = await this.toolService.sortJsonVisitors(
          this.myVisitors,
          "name",
          true
        );
      } else {
        console.log("No Llamar getVisitors and sort");
      }
    });

    return await modal.present();
  }

  async removeVisitor(index: number, name: string) {
    const alertControl = await this.alertController.create({
      header: "Borrar al visitante ?",
      message: name,
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
          cssClass: "icon-color",
          handler: () => {},
        },
        {
          text: "Si",
          handler: async () => {
            try {
              this.myVisitors.splice(index, 1);
              this.toolService.setSecureStorage(
                "visitors",
                JSON.stringify(this.myVisitors)
              );
              if (this.myVisitors.length > 0) {
                this.myVisitors[0].open = true;
              }
            } catch (e: any) {
              alert("No se pudo borrar: " + e.message);
            }
          },
        },
      ],
    });

    await alertControl.present();
  }

  closeModal() {
    this.modalController.dismiss(this.selectedVisitor);
  }
}
