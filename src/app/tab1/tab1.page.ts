import { Component, Input, OnInit } from "@angular/core";
import {
  ModalController,
  AlertController,
  LoadingController,
  isPlatform,
  IonMenu,
  IonMenuButton,
} from "@ionic/angular/standalone";
import { environment } from "../../environments/environment";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonLabel,
  IonButton,
  IonButtons,
  IonFab,
  IonFabButton,
  IonFabList,
  IonPopover,
  IonList,
  IonItemGroup,
  IonItem,
  IonToggle,
  IonRefresher,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCard,
  IonRefresherContent,
} from "@ionic/angular/standalone";
import { CommonModule } from "@angular/common";

import { UsersPage } from "../modals/users/users.page";
import { VisitorListPage } from "../modals/visitor-list/visitor-list.page";
import { FamilyPage } from "../modals/family/family.page";
import { RequestsPage } from "../modals/requests/requests.page";
import { LocalNotifications } from "@capacitor/local-notifications";
import { DatabaseService } from "../services/database.service";
import { Router } from "@angular/router";
import { UpdUsersPage } from "../modals/upd-users/upd-users.page";
import { BackstagePage } from "../modals/backstage/backstage.page";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ToolsService } from "../services/tools.service";
import { SMS, SmsOptions } from "@ionic-native/sms/ngx";
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";
import { ScreenOrientation } from "@ionic-native/screen-orientation/ngx";
import { NetworkService } from "../services/network.service";
import { addIcons } from "ionicons";
import {
  ellipsisVerticalOutline,
  chevronUpOutline,
  chevronDownOutline,
  add,
  personOutline,
  lockClosedOutline,
  personAddOutline,
  personCircleOutline,
  toggleOutline,
  documentOutline,
  shareSocialOutline,
  mailOutline,
  menu,
} from "ionicons/icons";
import { catchError, throwError, from, Observable, of } from "rxjs";
import { tap, switchMap } from "rxjs/operators";
import { Preferences } from "@capacitor/preferences";

@Component({
  selector: "app-tab1",
  templateUrl: "tab1.page.html",
  styleUrls: ["tab1.page.scss"],
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    CommonModule,
    IonIcon,
    IonButton,
    IonButtons,
    IonFab,
    IonFabButton,
    IonFabList,
    IonList,
    IonPopover,
    IonItemGroup,
    IonItem,
    IonToggle,
    IonRefresher,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonRefresherContent,
    IonMenuButton,
  ],
})
export class Tab1Page implements OnInit {
  //#region  variables-------------------------
  public localInfo: any = [];
  public codes: [] = [];
  @Input() msg: string = "";
  @Input() sim: string = "";
  myToast: any;
  myRoles: any;
  public MyRole: any | "" = "admin";
  isAndroid: any;
  currentUser = "";
  public version = "";
  public coreName: any | null = "";
  public coreId: any | null = "";
  twilio_client: any;
  userId: any = "";
  id: number = 0;
  btnVisible: boolean = true;
  titleMenuButtons = "Ocultar botones";

  infoPanel: any;
  myEmail: any | null = "";
  myName: any | null = "";
  REST_API_SERVER = environment.cloud.server_url;
  iosOrAndroid: boolean = false;
  demoMode: any;
  remoteCtrl:any;

  // #endregion -----
  constructor(
    private sms: SMS,
    public modalController: ModalController,
    private api: DatabaseService,
    public alertCtrl: AlertController,
    private router: Router,
    private toolService: ToolsService,
    private loadingController: LoadingController,
    private screenOrientation: ScreenOrientation,
    public networkService: NetworkService
  ) {
    addIcons({
      ellipsisVerticalOutline,
      chevronUpOutline,
      chevronDownOutline,
      add,
      personOutline,
      documentOutline,
      lockClosedOutline,
      personAddOutline,
      personCircleOutline,
      toggleOutline,
      shareSocialOutline,
      mailOutline,
    });
  }

  async ngOnInit() {
    this.version = environment.app.version;

    if (isPlatform("cordova") || isPlatform("ios")) {
      this.lockToPortrait();
    } else if (isPlatform("android")) {
      this.isAndroid = true;
    }

    this.MyRole = await this.toolService.getSecureStorage("myRole");

    this.myEmail = await this.toolService.getSecureStorage("email");    

    this.myName = await this.toolService.getSecureStorage("name");

    //   getting remote ---------------------------
    this.remoteCtrl = await this.toolService.getSecureStorage("remote");

    var sim = await this.toolService.getSecureStorage("coreSim");

    this.userId = await this.toolService.getSecureStorage("userId");

    this.coreId = await this.toolService.getSecureStorage("coreId");

    this.coreName = await this.toolService.getSecureStorage("coreName");

    //   getting demoMode ---------------------------
    await this.getDemoMode();

    // -----------------firebase Push notification
    let  devicePlatform: any = await this.toolService.getSecureStorage("devicePlatform");

    if (["android", "ios"].includes(devicePlatform)) {
      PushNotifications.requestPermissions().then((resul) => {
        if (resul.receive === "granted") {
          PushNotifications.register();
        } else {
          this.toolService.toastAlert(
            "Push notification not granted..!",
            0,
            ["Ok"],
            "middle"
          );
        }
      });

      PushNotifications.addListener("registration", (token: Token) => {
        console.log("Push registration success, token: " + token.value);
      });

      //  Subscribe to a specific topic
      FCM.subscribeTo({ topic: this.coreId! })
        .then()
        .catch((err) => console.log(err));

      // Enable the auto initialization of the library
      FCM.setAutoInit({ enabled: true }).then();

      PushNotifications.addListener("registrationError", (error: any) => {
        alert("Error on registration: " + JSON.stringify(error));
      });

      // pushNotification Received event
      PushNotifications.addListener(
        "pushNotificationReceived",
        (notification: PushNotificationSchema) => {
          this.toolService.toastAlert(notification.body!, 0, ["Ok"], "middle");
        }
      );

      // pushNotification clicked Action Performed event
      PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification: ActionPerformed) => {
          // alert('Push action performed: ' + JSON.stringify(notification));
        }
      );

      // -----------------------------------------------------
    }

    // getting info data
    if (environment.app.debugging) {
      console.log("collect Info jumped, because debugging!");
      await this.toolService.toastAlert(
        "collect Info jumped, because debugging!",
        0,
        ["Ok"],
        "bottom"
      );
    } else {
      this.collectInfo();
    }

    this.infoPanel = document.getElementById("infoSection");
    this.infoPanel.style.marginTop = "115px";
  }

  toggleButtons() {
    this.btnVisible = !this.btnVisible;

    if (this.btnVisible) {
      this.titleMenuButtons = "Ocultar botones";
      this.infoPanel.style.marginTop = "115px";
    } else {
      this.titleMenuButtons = "Mostrar botones";
      this.infoPanel.style.marginTop = "0px";
    }
  }

  async ModalUsers() {
    const modal = await this.modalController.create({
      component: UsersPage,
      backdropDismiss: true,
      componentProps: { CoreId: this.coreId, coreName: this.coreName },
    });

    modal.present();
  }

  async newVisitor() {
    const modal = await this.modalController.create({
      component: VisitorListPage,
      // cssClass:"my-modal"
    });

    modal.present();
  }

  async openFamily() {
    const modal = await this.modalController.create({
      component: FamilyPage,
    });

    modal.present();
  }

  async recoverAccount() {
    const modal = await this.modalController.create({
      component: RequestsPage,
      componentProps: { request: "UnblockAccount" },
    });
    await modal.present();
  }

  async deviceLost() {
    const modal = await this.modalController.create({
      component: RequestsPage,
      componentProps: { request: "deviceLost" },
    });
    await modal.present();
  }

  async localNotification() {
    this.scheduleBasic("Peatonal abierta");
  }

  async scheduleBasic(msg: any) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Core Alert",
          body: msg,
          id: 2,
          summaryText: "Priv. San Juan",
          extra: {
            data: "Pass data to your handler",
          },
          iconColor: "#488AFF",
        },
      ],
    });
  }

  async fcmNotification() {
    this.api.postData(`api/alerts/${this.coreId}/peatonal open/`, "");
  }

  lockToPortrait() {
    let devicePlatform: any | null = null;
    devicePlatform = this.toolService.getSecureStorage("devicePlatform");
    if (["android", "ios"].includes(devicePlatform))
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);
  }

  async logout() {
    await this.showAlert("", "", "Deseas salir ?", "btns", "Si", "No");
  }

  async comentar() {
    const modal = await this.modalController.create({
      component: UpdUsersPage,
      componentProps: {
        SourcePage: "commentApp",
      },
    });

    await modal.present();
  }

  async modalBackstage() {
    let coreName = await this.toolService.getSecureStorage("coreName");

    const modal = await this.modalController.create({
      component: BackstagePage,
      componentProps: {
        SourcePage: "tab1NewNeighbor",
        coreName: coreName,
      },
    });
    return await modal.present();
  }

  async collectInfo() {
    let timestamp:any;

    if (await this.networkService.checkInternetConnection()) {
      timestamp = await this.toolService.getSecureStorage("lastInfoUpdated");

      if (timestamp.value === null) {
            timestamp = await this.toolService.convDate(new Date());
          }

      const info  = await this.toolService.getSecureStorage("info");

       if (this.localInfo.length == 0 && !info ) {
            let d = new Date();
            d.setDate(d.getDate() - 180);
            timestamp = this.toolService.convDate(d);
          }

      if (this.localInfo.length == 0 && info) {
        this.localInfo = info;
      }


      try {
        this.api
          .getData("api/info/" + this.userId + "/" + timestamp)
          .subscribe({
            next: async (result: any) => {
              if (Object.keys(result).length > 0) {
                // get last api call variable
                if (this.localInfo.length > 0) {
                  Object.entries(result).forEach(async ([key, item]) => {
                    // this.localInfo.push(item);
                    this.localInfo = [...this.localInfo, item];
                  });
                } else {
                  this.localInfo = await result;
                }

                this.localInfo = await this.toolService.sortJsonVisitors(
                  this.localInfo,
                  "updatedAt",
                  false
                );

                // cleanup info
                if (this.localInfo.length > 1000) {
                  this.localInfo.splice(1000);
                }

                this.toolService.setSecureStorage("info",this.localInfo);
              }
            },
            error: (error: any) => {
              console.error("collect info error : ", error);
            },
          });

        this.toolService.setSecureStorage(
          "lastInfoUpdated",
          this.toolService.convDate(new Date())
        );

      } catch (e) {
        this.toolService.toastAlert(
          "Error api/info/ call: " + e,
          0,
          ["Ok"],
          "middle"
        );
      }
    } else {
      if (this.localInfo.length == 0 && this.localInfo) {
        this.localInfo = await this.toolService.getSecureStorage("info")
      }
      this.toolService.toastAlert(
        "No hay acceso a internet",
        0,
        ["Ok"],
        "middle"
      );
    }
  }

  async doRefresh(event: any) {
    this.collectInfo();

    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  async DemoMode() {
    this.toolService.setSecureStorage("demoMode", this.demoMode.toString());
    console.log("Set DemoMode tab1: ", this.demoMode);
  }

  async getDemoMode() {
    this.demoMode = await this.toolService.getSecureStorage("demoMode");
  }

  async openUrl(url: string) {
    window.open(url);
  }

  async getTimestamp() {
    var myDate = new Date();
    var offset = myDate.getTimezoneOffset() * 60 * 1000;

    var withOffset = myDate.getTime();
    var withoutOffset = withOffset - offset;
    return withoutOffset;
  }

  async sendSMS(door: string) {
    var options: SmsOptions = {
      replaceLineBreaks: false,
      android: {
        intent: "",
      },
    };

    let local_sim = await this.toolService.getSecureStorage("coreSim");

    let use_twilio = await this.toolService.getSecureStorage("twilio")

    let uuid = await this.toolService.getSecureStorage("deviceUuid");

    

    // const local_sim =  await this.storage.get('coreSim');

    // create milliseconds block  for local timestamp -------

    // timestamp ------------------------

    this.sim = local_sim ?? "";
    this.msg = "open," + (await this.getTimestamp()) + "," + door + "," + uuid;
    // --------------------------------

    if (!local_sim) {
      this.toolService.showAlertBasic("Alerta", "Privada no tiene Sim", "", [
        "Ok",
      ]);
      return;
    }

    try {
      this.loadingController
        .create({
          message: "Abriendo ...",
          translucent: true,
        })
        .then(async (res) => {
          res.present();
          if (!use_twilio) {
            // Check if user is locked
            this.api.getData("api/users/notLocked/" + this.userId).subscribe({
              next: async (res) => {
                await this.sms
                  .send(this.sim, this.msg, options)
                  .then(() => this.loadingController.dismiss())
                  .catch((e: any) => {
                    this.loadingController.dismiss();
                    this.toolService.showAlertBasic(
                      "Alerta",
                      "Error",
                      "Falla conexion a red telefonica",
                      ["Ok"]
                    );
                  });
              },
              error: async (err) => {
                this.loadingController.dismiss();
                await this.showAlert(
                  "",
                  "",
                  "Usuario bloqueado",
                  "btns",
                  "Ok",
                  ""
                );
              },
            });
          } else {
            this.api.postData(
              "api/twilio/open/" +
                this.userId +
                "/" +
                this.msg +
                "/" +
                this.sim,
              ""
            );
            this.loadingController.dismiss();
          }
        });
    } catch (e) {
      this.toolService.showAlertBasic(
        "Aviso",
        "Ocurrio una excepción revisar:",
        `Error: ${e}`,
        ["Cerrar"]
      );
    }
  }

  // -------   toast control alerts    ---------------------

  async showAlert(
    Header: string,
    subHeader: string,
    msg: string,
    btns: any,
    txtConfirm: string,
    txtCancel: string
  ) {
    const alert = await this.alertCtrl.create({
      header: Header,
      subHeader: subHeader,
      message: msg,
      backdropDismiss: false,
      buttons: [
        {
          text: txtCancel,
          role: "cancel",
        },
        {
          text: txtConfirm,
          handler: async () => {
            this.api.logout();
            this.router.navigateByUrl("/", { replaceUrl: true });
            this.toolService.cleanSecureStorage();
          },
        },
      ],
    });

    await alert.present();
  }
}
