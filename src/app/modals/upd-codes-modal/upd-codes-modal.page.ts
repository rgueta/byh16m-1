import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from "@angular/core";
import {
  ModalController,
  AlertController,
  LoadingController,
  Platform,
  ToastController,
  IonSelect,
  IonLoading,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonTextarea,
  IonLabel,
  IonRange,
  IonIcon,
  IonButtons,
} from "@ionic/angular/standalone";
import { CommonModule } from "@angular/common";

import { DatabaseService } from "../../services/database.service";
import { Utils } from "../../tools/tools";
import { Sim } from "@ionic-native/sim/ngx";
import { SMS, SmsOptions } from "@ionic-native/sms/ngx";
import {
  FormBuilder,
  FormsModule,
  Validators,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { VisitorListPage } from "../visitor-list/visitor-list.page";
import { ToolsService } from "../../services/tools.service";
import html2canvas from "html2canvas";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { QrCodeComponent } from "ng-qrcode";
import { addIcons } from "ionicons";
import { arrowBackCircleOutline } from "ionicons/icons";

const USERID = "userId";

@Component({
  selector: "app-upd-codes-modal",
  templateUrl: "./upd-codes-modal.page.html",
  styleUrls: ["./upd-codes-modal.page.scss"],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonItem,
    IonTextarea,
    IonLabel,
    IonRange,
    ReactiveFormsModule,
    QrCodeComponent,
    IonIcon,
    IonButtons,
  ],
})
export class UpdCodesModalPage implements OnInit {
  RegisterForm: FormGroup | any;
  @Input() code: string = "";
  @Input() visitorSim: string = "";
  @Input() visitorCode: string = "";
  @Input() range: Number = 0;
  @Input() localComment: string = "";

  @ViewChild("VisitorList") visitorSelectRef: IonSelect | any;

  myVisitors: any;
  selectedVisitor: any;
  initial: any = new Date().toISOString();
  expiry: any = new Date().toISOString();
  diff: any;
  expiry_hrs = 0;
  userId = {};
  StrPlatform = "";
  comment = "";
  Localtoast: any;
  codeCreated: boolean = false; //to return callback for resfresh or not

  public code_expiry: any;

  constructor(
    public modalController: ModalController,
    public api: DatabaseService,
    public platform: Platform,
    public libSim: Sim,
    public sms: SMS,
    public toast: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toolService: ToolsService
  ) {
    addIcons({ arrowBackCircleOutline });
    this.validateControls();
  }

  async validateControls() {
    this.RegisterForm = new FormGroup({
      ValidVisitorName: new FormControl("", [Validators.required]),
      ValidVisitorSim: new FormControl("", [Validators.required]),
    });
  }

  async ngOnInit() {
    this.userId = localStorage.getItem("userId")!;

    this.code_expiry = Number(localStorage.getItem("code_expiry")!);

    this.code = this.genCode(7);
    this.getVisitors();
    this.initDates();
    this.getPlatform();

    this.libSim
      .hasReadPermission()
      .then((info: any) => console.log("Has permission: ", info));

    this.libSim.requestReadPermission().then(
      () => console.log("Permission granted"),
      () => console.log("Permission denied")
    );

    this.libSim.getSimInfo().then(
      (info: any) => console.log("Sim info: ", info),
      (err: any) => console.log("Unable to get sim info: ", err)
    );
  }

  getPlatform() {
    if (this.platform.is("android")) {
      this.StrPlatform = "android";
    } else if (this.platform.is("ios")) {
      this.StrPlatform = "ios";
    } else if (this.platform.is("desktop")) {
      this.StrPlatform = "desktop";
    } else if (this.platform.is("mobile")) {
      this.StrPlatform = "mobile";
    } else {
      this.StrPlatform = "other";
    }
  }

  async initDates() {
    this.initial = new Date();
    this.expiry = new Date(
      new Date().setHours(new Date().getHours() + this.code_expiry)
    );
    this.diff = (
      Math.abs(this.initial.getTime() - this.expiry.getTime()) / 3600000
    ).toFixed(1);

    this.initial = new Date().toISOString();
    this.expiry = new Date(
      new Date().setHours(new Date().getHours() + this.code_expiry)
    ).toISOString();
  }

  async onRangeChange(event: any) {
    var expiry = new Date();
    this.diff = event.detail.value;

    this.expiry = expiry.setHours(
      expiry.getHours() + Number(event.detail.value)
    );
  }

  async getVisitors() {
    const visitors = localStorage.getItem("visitors");
    const lenVisitors = visitors !== null ? visitors.length : 0;
    if (lenVisitors > 0) {
      this.myVisitors = await JSON.parse(localStorage.getItem("visitors")!);

      //Sort Visitors by name
      this.myVisitors = await Utils.sortJsonVisitors(
        this.myVisitors,
        "name",
        true
      );
    }
  }

  async setupCode(event: any) {
    this.visitorSim = this.selectedVisitor.sim;
    this.visitorSelectRef.disabled;
  }

  async updSelectedVisitor(item: any) {
    for (var i = 0; i < this.myVisitors.length; i++) {
      if (
        item.name === this.myVisitors[i].name &&
        item.sim === this.myVisitors[i].sim
      ) {
        this.myVisitors[i].date = new Date();
        break;
      }
    }

    localStorage.setItem("visitors", JSON.stringify(this.myVisitors));
  }

  newCode() {
    this.code = this.genCode(7);
  }

  genCode(len: number) {
    var result = [];
    var characters = "0123456789ABCD";
    var charactersLength = characters.length;
    for (var i = 0; i < len; i++) {
      result.push(
        characters.charAt(Math.floor(Math.random() * charactersLength))
      );
    }
    return result.join("");
  }

  async onChangeComment($event: any) {
    this.localComment = $event;
  }

  async onSubmitTemplate(SendVisitor: boolean) {
    var dateInit = "";
    var dateFinal = "";
    this.codeCreated = true;

    const coreSim = localStorage.getItem("coreSim");
    const userSim = localStorage.getItem("sim");
    const coreName = localStorage.getItem("coreName");
    const expire = (
      (new Date(this.expiry).getTime() - new Date().getTime()) /
      3600000
    ).toFixed(1);

    this.loadingController
      .create({
        message: " Mandando codigo ...",
        translucent: true,
      })
      .then(async (res: any) => {
        res.present();

        try {
          this.api
            .postData("api/codes/" + this.userId, {
              code: this.code,
              sim: this.visitorSim,
              initial: Utils.convDate(new Date(this.initial)),
              expiry: Utils.convDate(new Date(this.expiry)),
              visitorSim: "n/a",
              visitorName: "n/a",
              comment: this.localComment,
              source: {
                user: this.userId,
                platform: this.StrPlatform,
                id: userSim,
              },
            })
            .then(
              async (resp: any) => {
                //------- Uncomment, just to fix bug

                const respId = await Object.values(resp)[1];

                // #region Send code to Core  ----------------------

                const pckgToCore =
                  "codigo," +
                  (await this.getTimestamp()) +
                  "," +
                  this.code +
                  "," +
                  Utils.convDate(new Date(this.expiry)) +
                  "," +
                  this.userId +
                  ",n/a," +
                  respId;

                // Check if core has sim to send sms
                if (coreSim) {
                  await this.sendSMS(coreSim, pckgToCore)
                    .then(() => {
                      console.log("Sending sms");
                    })
                    .catch((e: any) => {
                      this.loadingController.dismiss();
                      this.toolService.showAlertBasic(
                        "",
                        "Error, send sms to core:",
                        e,
                        ["Ok"]
                      );
                      this.closeModal();
                      return;
                    });
                }

                // #endregion  --------------

                this.loadingController.dismiss();
                this.closeModal();
              },
              (error) => {
                this.loadingController.dismiss();
                this.toolService.showAlertBasic(
                  "",
                  "Can not create code",
                  "error: " + error,
                  ["Ok"]
                );
              }
            );
        } catch (err) {
          this.loadingController.dismiss();
          this.toolService.showAlertBasic(
            "",
            "Can not create code",
            "error: " + err,
            ["Ok"]
          );
        }
      });
  }

  async getTimestamp() {
    var myDate = new Date();
    var offset = myDate.getTimezoneOffset() * 60 * 1000;

    var withOffset = myDate.getTime();
    var withoutOffset = withOffset - offset;
    return withoutOffset;
  }

  async sendSMS(sim: string, text: string) {
    var options: SmsOptions = {
      replaceLineBreaks: false,
      android: {
        intent: "",
      },
    };

    const use_twilio = localStorage.getItem("twilio");

    try {
      if (use_twilio == "false") {
        await this.sms.send(sim, text);
      } else {
        this.api.postData(
          "api/twilio/open/" + this.userId + "/" + text + "/" + sim,
          ""
        );
      }
    } catch (e) {
      // alert('Text was not sent !')
      const toast = await this.toast.create({
        message: "Text was not sent !.. error: " + e,
        duration: 3000,
      });

      toast.present();
    }
  }

  async sendQR() {
    const txtHrs = this.diff > 1 ? " hrs. ?" : " hr. ?";

    await this.showAlert(
      "",
      "Confirmar",
      "Mandar codigo de " + Number(this.diff).toFixed(0) + txtHrs,
      "btns",
      "Si",
      "No"
    );
  }

  //#region -----------------------   QR -----------------------------

  async captureQRscreen() {
    // const html2canvas = (await import("html2canvas")).default;
    const element = document.getElementById("qrImage") as HTMLElement;
    html2canvas(element).then((canvas: HTMLCanvasElement) => {
      this.shareImage(canvas);
    });
  }

  async shareImage(canvas: HTMLCanvasElement) {
    let base64 = canvas.toDataURL();
    let path = "qr.png";

    const loading = await this.loadingController.create({
      translucent: true,
      spinner: "crescent",
    });

    await loading.present();

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    })
      .then(async (res: any) => {
        let uri = res.uri;
        await Share.share({
          url: uri,
        })
          .then(async (resp: any) => {
            await Filesystem.deleteFile({
              path,
              directory: Directory.Cache,
            });

            // send code to mongo and core device
            this.onSubmitTemplate(false);
          })
          .catch((err: any) => {
            console.log("error sharing, " + err.message);
          });
      })
      .finally(() => {
        this.loadingController.dismiss();
      });
  }

  //#endregion -------------------  QR --------------------------------

  // -------   show alerts              ---------------------------------
  async showAlert(
    Header: string,
    subHeader: string,
    msg: string,
    btns: any,
    txtConfirm: string,
    txtCancel: string
  ) {
    const alert = await this.alertController.create({
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
            this.captureQRscreen();
          },
        },
      ],
    });

    await alert.present();
  }

  async openVisitorModal() {
    const modal = await this.modalController.create({
      component: VisitorListPage,
    });

    modal.onDidDismiss().then(async (item) => {
      if (item.data) {
        this.selectedVisitor = item.data;
        this.visitorCode = item.data["name"] ? item.data["name"] : "";
        this.visitorSim = item.data["sim"] ? item.data["sim"] : "";
      }
    });

    return await modal.present();
  }

  closeModal() {
    this.modalController.dismiss(this.codeCreated);
  }
}
