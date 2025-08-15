import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthenticationService } from "./../../services/authentication.service";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { environment } from "../../../environments/environment";
import {
  AlertController,
  LoadingController,
  ModalController,
  Platform,
} from "@ionic/angular/standalone";
import { ScreenOrientation } from "@ionic-native/screen-orientation/ngx";
import { Device } from "@capacitor/device";
import { RequestsPage } from "../../modals/requests/requests.page";
import { Sim } from "@ionic-native/sim/ngx";
import { DatabaseService } from "../../services/database.service";
import { ToolsService } from "src/app/services/tools.service";
import { NetworkService } from "../../services/network.service";
import { Capacitor } from "@capacitor/core";
import { UpdUsersPage } from "../../modals/upd-users/upd-users.page";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
} from "@ionic/angular/standalone";

import { addIcons } from "ionicons";
import { eye, eyeOffOutline } from "ionicons/icons";
import { catchError, throwError, from, Observable, of } from "rxjs";
import { tap, switchMap } from "rxjs/operators";

@Component({
  selector: "app-login",
  templateUrl: "login.page.html",
  styleUrls: ["login.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonButton,
    CommonModule,
    FormsModule,
    IonIcon,
    IonInput,
    IonItem,
    ReactiveFormsModule,
  ],
})
export class LoginPage implements OnInit {
  // #region injection ----
  private fb = inject(FormBuilder);
  private authService = inject(AuthenticationService);
  private orientation = inject(ScreenOrientation);
  private loadingController = inject(LoadingController);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private SIM = inject(Sim);
  private platform = inject(Platform);
  private api = inject(DatabaseService);
  public toolService = inject(ToolsService);
  public networkService = inject(NetworkService);
  // #endregion  ------
  isAndroid: any;
  credentials!: FormGroup;
  configApp!: {};

  showPassword: boolean = false;
  passwordToggleIcon: string = "eye";

  // Easy access for form fields
  get email() {
    return this.credentials.get("email")!;
  }

  get password() {
    return this.credentials.get("pwd")!;
  }

  public device_info: any;

  private REST_API_SERVER = environment.cloud.server_url;
  public version = "";
  net_status: any;
  deviceUuid: string = "";
  adminDevice: any;
  adminSim: [] = [];
  adminEmail: [] = [];

  public myToast: any;

  constructor() {
    addIcons({ eye, eyeOffOutline });
  }

  async ngOnInit() {
    if (Capacitor.getPlatform() == "android") {
      this.isAndroid = true;
      this.lockToPortrait();
      console.log("Es platform --> android..");
    } else if (Capacitor.getPlatform() == "ios") {
      this.lockToPortrait();
      console.log("Es platform --> ios");
    } else if (Capacitor.getPlatform() == "ipad") {
      this.lockToPortrait();
      console.log("Es platform --> ipad");
    } else if (Capacitor.getPlatform() == "iphone") {
      this.lockToPortrait();
      console.log("Es platform --> iphone");
    } else if (Capacitor.getPlatform() == "web") {
      console.log("Es platform --> web");
      // this.lockToPortrait();
    } else if (Capacitor.getPlatform() == "cordova") {
      console.log("Es platform --> cordova");
    }

    this.getConfigApp();
    // this.toolService.cleanSecureStorage();
    this.init();
    this.version = environment.app.version;

    this.credentials = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
      pwd: new FormControl("", [Validators.required, Validators.minLength(4)]),
    });
  }

  async getDeviceInfo() {
    await Device.getInfo()
      .then(async (DeviceInfo: any) => {
        this.device_info = await JSON.parse(JSON.stringify(DeviceInfo));
        console.log("device_info: ", this.device_info);
        //#region get device uuid  --------------------------------
        await Device.getId()
          .then(async (deviceId: any) => {
            this.toolService.setSecureStorage(
              "deviceUuid",
              deviceId["identifier"]
            );
            this.deviceUuid = await deviceId["identifier"];
          })
          .catch((err) => {
            console.error("Error Device.getId inside Device.getInfo: ", err);
          });

        //#endregion  -------------
        this.device_info.uuid = this.deviceUuid;
        this.toolService.setSecureStorage(
          "deviceInfo",
          JSON.stringify(this.device_info)
        );
        this.toolService.setSecureStorage(
          "devicePlatform",
          this.device_info.platform
        );
        //#region soy android ---------------------------------

        if (this.device_info.platform === "android") {
          try {
            delete this.device_info.memUsed;
            delete this.device_info.diskFree;
            delete this.device_info.diskTotal;
            delete this.device_info.realDiskFree;
            delete this.device_info.realDiskTotal;
          } catch (e) {
            console.error(
              "Soy android, error al borrar algunos campos de device_info : ",
              e
            );
          }
          //#endregion  ---------------------------------------
        }
        this.toolService.setSecureStorage(
          "deviceInfo",
          JSON.stringify(this.device_info)
        );

        // Hard Code -----
        if (this.device_info.uuid == this.deviceUuid) {
          this.credentials.get("email")!.setValue(environment.cloud.admin);
          this.credentials.get("pwd")!.setValue(environment.cloud.padmin);
        }
      })
      .catch((err) => {
        console.error("Error Device.getInfo..: ", err);
      });
  }

  // get Config App ----
  async getConfigApp() {
    this.api.getData("api/config/").subscribe({
      next: async (result: any) => {
        this.adminDevice = result[0].admin_device;
        this.adminSim = result[0].admin_sim;
        this.adminEmail = result[0].admin_email;

        // secure storage ----------------
        this.toolService.setSecureStorage(
          "adminSim",
          JSON.stringify(result[0].admin_sim)
        );
        this.toolService.setSecureStorage("adminDevice", this.adminDevice);
        this.toolService.setSecureStorage(
          "adminEmail",
          JSON.stringify(result[0].admin_email)
        );
      },
      error: (error) => {
        console.log("Fallo obtener config: ", error);
      },
    });
  }

  async init(): Promise<void> {
    await this.getDeviceInfo();
    // Check sim permissions  --------------------
    if (this.device_info.platform != "web") {
      await this.SIM.hasReadPermission()
        .then(async (allowed: any) => {
          if (!allowed) {
            await this.SIM.requestReadPermission()
              .then()
              .catch((err: any) => {
                console.error("Sim Permission denied: " + err);
              });
          } else {
            await this.SIM.getSimInfo()
              .then((info: any) => {
                console.log("Si estoy en init() allowed :", allowed);
                console.log("Sim info: ", info);
              })
              .catch((err: any) =>
                console.error("Unable to get sim info: " + err)
              );
          }
        })
        .catch((err: any) => {
          console.error("Sim Permission denied, " + err);
        });
    }
  }

  lockToPortrait() {
    this.orientation.lock(this.orientation.ORIENTATIONS.PORTRAIT);
  }

  async login() {
    var lockedValue: "true";

    let roles: any | null = null;

    try {
      const netStatus = await this.networkService.checkInternetConnection();
      if (!netStatus) {
        await this.toolService.toastAlert(
          "No hay acceso a internet",
          0,
          ["Ok"],
          "middle"
        );
        return;
      } else {
        const loading = await this.loadingController.create({
          message: "Espere...",
        });
        await loading.present();
        this.authService.login(this.credentials.value).subscribe({
          next: async (res) => {
            await loading.dismiss();

            // Check Locked --------------------
            this.toolService.getSecureStorage("locked").subscribe({
              next: async (result) => {
                lockedValue = result;
              },
            });

            // In your component
            this.toolService.getSecureStorage("roles").subscribe({
              next: async (result) => {
                roles = await result;
                console.log("Result roles :", roles);

                for (const val_myrole of JSON.parse(roles)) {
                  console.log("lockedValue: ", lockedValue);
                  if (lockedValue === "true") {
                    console.log("Usuario Locked...");
                    await this.lockedUser("Usuario bloqueado !");
                    return;
                  }
                  if (
                    val_myrole.name === "admin" ||
                    val_myrole.name === "neighbor" ||
                    val_myrole.name === "neighborAdmin"
                  ) {
                    this.router.navigateByUrl("/tabs", { replaceUrl: true });
                  } else {
                    this.router.navigateByUrl("/store", { replaceUrl: true });
                  }
                }
                // get config info
                this.getConfigApp();
              },
              error: (err) => {},
            });
          },
          error: async (err) => {
            if (err.error.errId == 1) {
              console.log("Abrir registro");
            }
            await loading.dismiss();

            let msgErr = "";

            const alert = await this.alertController.create({
              header: msgErr,
              message: err.error.ErrMsg,
              buttons: [
                {
                  text: "Registro nuevo ?",
                  role: "registro",
                  handler: () => {
                    this.newUser();
                  },
                },
                { text: "OK" },
              ],
            });

            await alert.present();
          },
        });
      }
    } catch (err) {
      console.log("Error: ", err);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    if (this.passwordToggleIcon == "eye") {
      this.passwordToggleIcon = "eye-off-outline";
    } else {
      this.passwordToggleIcon = "eye";
    }
  }

  async newUser() {
    const modal = await this.modalController.create({
      component: UpdUsersPage,
      componentProps: {
        sourcePage: "login",
        coreName: "",
        coreId: "",
        pathLocation: "",
      },
    });

    await modal.present();
  }

  async lockedUser(msg: string) {
    const alert = await this.alertController.create({
      // header: msgErr,
      message: msg,
      buttons: [
        {
          text: "OK",
          role: "registro",
          handler: () => {
            const url = "/";
            this.router.navigateByUrl(url, { replaceUrl: true });
            // this.router.navigate([url] , { state : { from : 'login'}  }); //send parameters
          },
        },
      ],
    });

    await alert.present();
  }

  async pwdReset() {
    const modal = await this.modalController.create({
      component: RequestsPage,
      componentProps: { request: "pwdReset" },
    });

    await modal.present();
  }

  async openStore() {
    this.router.navigate(["/store"]);
  }

  // -------------- Notifications ---------------------------

  async showAlert(Header: string, subHeader: string, msg: string, btns: any) {
    const alert = await this.alertController.create({
      header: Header,
      subHeader: subHeader,
      message: msg,
      buttons: btns,
    });

    await alert.present();
  }
}
