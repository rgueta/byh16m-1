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
import { FormsModule } from "@angular/forms";
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
  public MyRole: string | "" = "admin";
  isAndroid: any;
  currentUser = "";
  public version = "";
  public coreName: string | null = "";
  public coreId: string | null = "";
  twilio_client: any;
  userId: string = "";
  id: number = 0;
  btnVisible: boolean = true;
  titleMenuButtons = "Ocultar botones";

  infoPanel: any;
  myEmail: any | null = "";
  myName: any | null = "";
  REST_API_SERVER = environment.cloud.server_url;
  iosOrAndroid: boolean = false;
  demoMode: boolean = false;
  remote: any = false;
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

  async ionViewWillEnter() {
    this.version = environment.app.version;
    if (isPlatform("cordova") || isPlatform("ios")) {
      this.lockToPortrait();
    } else if (isPlatform("android")) {
      this.isAndroid = true;
    }

    if (!this.remote) {
      document
        .getElementById("infoSection")!
        .style.setProperty("margin-top", "15px", "important");
    }
  }

  async ngOnInit() {
    //   getting myRole ---------------------------
    this.toolService.getSecureStorage("myRole").subscribe({
      next: (result) => {
        this.MyRole = result || "visitor";
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo myRole en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    //   getting email ---------------------------
    this.toolService.getSecureStorage("email").subscribe({
      next: async (result) => {
        this.myEmail = await result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo email en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    // this.myName = this.toolService.getSecureStorage("name");
    //   getting name ---------------------------
    this.toolService.getSecureStorage("name").subscribe({
      next: async (result) => {
        this.myName = await result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo name en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    //   getting remote ---------------------------
    this.toolService.getSecureStorage("remote").subscribe({
      next: async (result) => {
        this.remote = await result;
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

    console.log("MyRole at ngOnInit: ", this.MyRole);

    var sim = "";
    // getting coreSim ---------------------------
    this.toolService.getSecureStorage("coreSim").subscribe({
      next: (result) => {
        sim = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo coreSim en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    //   getting userId ---------------------------
    this.toolService.getSecureStorage("userId").subscribe({
      next: (result) => {
        this.userId = result;
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

    //   getting coreId ---------------------------
    this.toolService.getSecureStorage("coreId").subscribe({
      next: (result) => {
        this.coreId = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo coreId en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    //   getting coreName ---------------------------
    this.toolService.getSecureStorage("coreName").subscribe({
      next: (result) => {
        this.coreName = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo coreName en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    //   getting demoMode ---------------------------
    this.toolService.getSecureStorage("demoMode").subscribe({
      next: (result) => {
        this.demoMode = result == "true" ? true : false;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo demoMode en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    console.log("demoMode at ngOnInit: ", this.demoMode);

    // -----------------firebase Push notification
    //
    let devicePlatform: any | null = null;
    devicePlatform = this.toolService.getSecureStorage("devicePlatform");
    this.toolService.getSecureStorage("devicePlatform").subscribe({
      next: (result) => {
        devicePlatform = result || "visitor";
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo myRole en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

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
    let coreName = "";

    //   getting coreName ---------------------------
    this.toolService.getSecureStorage("coreName").subscribe({
      next: async (result) => {
        coreName = await result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo coreName en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

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
    let timestamp: string = "";

    if (await this.networkService.checkInternetConnection()) {
      let timestamp: any;
      // get last api call variable

      //   getting lastInfoUpdated ---------------------------
      this.toolService.getSecureStorage("lastInfoUpdated").subscribe({
        next: (result) => {
          if (!result) {
            timestamp = this.toolService.convDate(new Date());
          } else {
            timestamp = result;
            // timestamp = '2024-01-29T00:49:49.857Z'
          }
        },
        error: (err) => {
          this.toolService.toastAlert(
            "error, obteniendo lastInfoUpdated en getSecureStorage: " + err,
            0,
            ["Ok"],
            "middle"
          );
        },
      });

      this.toolService.getSecureStorage("info").subscribe({
        next: (result) => {
          if (this.localInfo.length == 0 && !result) {
            let d = new Date();
            d.setDate(d.getDate() - 180);
            timestamp = this.toolService.convDate(d);
          }

          if (this.localInfo.length == 0 && result) {
            this.localInfo = result;
          }
        },
        error: (err) => {
          this.toolService.toastAlert(
            "error, obteniendo info en getSecureStorage: " + err,
            0,
            ["Ok"],
            "middle"
          );
        },
      });

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
                  this.localInfo = result;
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

                this.toolService.setSecureStorage(
                  "info",
                  JSON.stringify(this.localInfo)
                );
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
        this.toolService.getSecureStorage("info").subscribe({
          next: (result) => {
            this.localInfo = result;
          },
          error: (err) => {
            this.toolService.toastAlert(
              "error, obteniendo info en getSecureStorage: " + err,
              0,
              ["Ok"],
              "middle"
            );
          },
        });
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

  DemoMode() {
    this.demoMode = !this.demoMode;
    this.toolService.setSecureStorage("demoMode", this.demoMode.toString());
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

  // Send a text message using default options

  async sendSMS(door: string) {
    if (this.msg == "") {
      this.toolService.toastAlert("Message empty !", 0, ["Ok"], "bottom");
      return;
    }
    var options: SmsOptions = {
      replaceLineBreaks: false,
      android: {
        intent: "",
      },
    };

    let local_sim = "";
    this.toolService.getSecureStorage("coreSim").subscribe({
      next: (result) => {
        local_sim = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo coreSim en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    let use_twilio = "";
    this.toolService.getSecureStorage("twilio").subscribe({
      next: (result) => {
        use_twilio = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo twilio en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    let uuid = "";
    this.toolService.getSecureStorage("deviceUuid").subscribe({
      next: (result) => {
        uuid = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo deviceUuid en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    // const local_sim =  await this.storage.get('coreSim');

    // create milliseconds block  for local timestamp -------

    // timestamp ------------------------

    this.sim = local_sim ?? "";
    this.msg = "open," + (await this.getTimestamp()) + "," + door + "," + uuid;

    // --------------------------------

    if (!local_sim) {
      // this.toolService.toastAlert('Privada sin Sim ',0, ['Ok'], 'bottom');
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
          if (use_twilio == "false") {
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
            this.toolService.cleanLocalStorage();
          },
        },
      ],
    });

    await alert.present();
  }
}
