import { Component, OnInit } from "@angular/core";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  AnimationController,
  AlertController,
  ModalController,
  IonLabel,
  IonItem,
  IonIcon,
  IonList,
  IonFabButton,
  IonFab,
  IonRefresherContent,
  IonRefresher,
} from "@ionic/angular/standalone";
// import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { SMS, SmsOptions } from "@ionic-native/sms/ngx";
import { DatabaseService } from "../services/database.service";
import { VisitorsPage } from "../modals/visitors/visitors.page";
import { ToolsService } from "../services/tools.service";
import { addIcons } from "ionicons";
import {
  chevronDownOutline,
  chevronForwardOutline,
  people,
  trashOutline,
} from "ionicons/icons";
import { NgFor, NgIf } from "@angular/common";

@Component({
  selector: "app-tab4",
  templateUrl: "tab4.page.html",
  styleUrls: ["tab4.page.scss"],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonItem,
    IonIcon,
    IonList,
    IonFabButton,
    IonFab,
    IonRefresherContent,
    IonRefresher,
    NgFor,
    NgIf,
  ],
})
export class Tab4Page implements OnInit {
  public VisitorsList: any;
  public myVisitorsList: any;
  automaticClose = false;
  userId: {} | null = {};
  public alertButtons = ["OK"];

  constructor(
    public animationController: AnimationController,
    public modalController: ModalController,
    public api: DatabaseService,
    private sms: SMS,
    private toolService: ToolsService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      chevronDownOutline,
      chevronForwardOutline,
      people,
      trashOutline,
    });
  }

  async ngOnInit() {
    this.toolService.getSecureStorage("userId").subscribe({
      next: async (result) => {
        this.userId = await result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo userId en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    this.getVisitors();
  }

  async doRefresh(event: any) {
    this.getVisitors();

    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  async refreshVisitors() {
    this.getVisitors();
  }

  async getVisitors() {
    this.toolService.getSecureStorage("visitors").subscribe({
      next: async (result) => {
        if (result) {
          this.VisitorsList = JSON.parse(result);
          //Sort Visitors by name
          if (this.VisitorsList !== null && this.VisitorsList.length > 0) {
            console.log("this.VisitorsList:", this.VisitorsList);
            if ((this, this.VisitorsList))
              this.VisitorsList = await this.toolService.sortJsonVisitors(
                this.VisitorsList,
                "name",
                true
              );

            this.VisitorsList[0].open = true;
          }
        }
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo remote en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });
  }

  async removeVisitor(index: number, name: string) {
    const alertControl = await this.alertCtrl.create({
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
              this.VisitorsList.splice(index, 1);
              this.toolService.setSecureStorage(
                "visitors",
                JSON.stringify(this.VisitorsList)
              );
              this.VisitorsList[0].open = true;
            } catch (e) {
              this.toolService.showAlertBasic(
                "Aviso",
                "Ocurrio una excepcion al borrar",
                "Error: " + e,
                ["Cerrar"]
              );
            }
          },
        },
      ],
    });

    await alertControl.present();
  }

  toggleSection(index: number) {
    this.VisitorsList[index].open = !this.VisitorsList[index].open;
    if (this.automaticClose && this.VisitorsList[index].open) {
      this.VisitorsList.filter(
        (item: [], itemIndex: number) => itemIndex != index
      ).map((item: any) => (item.open = false));
    }
  }

  async modalVisitors() {
    const modal = await this.modalController.create({
      component: VisitorsPage,
      backdropDismiss: true,
    });

    modal.onDidDismiss().then((_) => {
      this.getVisitors();
    });

    return await modal.present();
  }

  async update(
    field: string,
    visitorId: string,
    visitor: string,
    ActualValue: string
  ) {
    let dbField = "email";
    switch (field) {
      case "direccion":
        dbField = "address";
        break;
      case "telefono":
        dbField = "sim";
        break;
    }

    const alert = await this.alertCtrl.create({
      header: "Cambios a " + visitor,
      message: "Escribe los cambios a " + field,
      backdropDismiss: false,
      inputs: [{ name: dbField, value: ActualValue, placeholder: field }],
      buttons: [
        { text: "Cancelar", role: "cancel", handler: () => {} },
        {
          text: "Cambiar",
          handler: async (data: any) => {
            try {
              if (await this.toolService.getSecureBoolean("netStatus")) {
                await this.api
                  .putData(
                    "api/visitors/simple/" + this.userId + "/" + visitorId,
                    data
                  )
                  .then(
                    async (resp) => {},
                    (error) => {
                      this.errorUpdate(field);
                    }
                  );
              } else {
                this.toolService.toastAlert(
                  "No hay acceso a internet",
                  0,
                  ["Ok"],
                  "middle"
                );
              }
            } catch (err) {
              this.toolService.showAlertBasic(
                "Aviso",
                "Ocurrio una excepcion al cambiar " + field,
                "Error: " + err,
                ["Cerrar"]
              );
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async errorUpdate(field: string) {
    this.toolService.showAlertBasic("", "", "Cambio no realiado a " + field, [
      "Cerrar",
    ]);
  }

  async updateGender(visitorId: string, visitor: string, ActualValue: any) {
    let Male = false;
    let Female = false;
    let Other = false;
    if (ActualValue == "H") {
      Male = true;
    } else if (ActualValue == "M") {
      Female = true;
    } else {
      Other = true;
    }

    let alertGender = await this.alertCtrl.create({
      header: "Cambiar genero de " + visitor,
      message: "Favor de seleccionar el nuevo genero",
      backdropDismiss: true,
      inputs: [
        {
          name: "Mujer",
          type: "radio",
          label: "Mujer",
          value: "M",
          checked: Female,
        },
        {
          name: "Hombre",
          type: "radio",
          label: "Hombre",
          value: "H",
          checked: Male,
        },
        {
          name: "Otro",
          type: "radio",
          label: "Otro",
          value: "O",
          checked: Other,
        },
      ],
      buttons: [
        { text: "Cancelar", role: "cancel", handler: () => {} },
        {
          text: "Cambiar",
          handler: async (data: any) => {
            if (data == ActualValue) {
              console.log("Same value");
            } else {
              data = { gender: data };
              try {
                await this.api.putData(
                  "api/visitors/simple/" + this.userId + "/" + visitorId,
                  data
                );
                await this.getVisitors();
              } catch (err) {
                console.log("Can not change gender", err);
              }
            }
          },
        },
      ],
    });
    await alertGender.present();
  }
}
