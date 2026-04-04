import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  ElementRef,
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
import { Contacts } from "@capacitor-community/contacts";
import { SocialSharing } from "@awesome-cordova-plugins/social-sharing/ngx";

const USERID = "userId";

@Component({
  selector: "app-upd-codes",
  templateUrl: "./upd-codes.page.html",
  styleUrls: ["./upd-codes.page.scss"],
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
  providers: [SocialSharing],
})
export class UpdCodesPage implements OnInit {
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
  userId: string = "0";
  StrPlatform = "";
  comment = "";
  Localtoast: any;
  codeCreated: any = {}; //to return callback for resfresh or not

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
    private toolService: ToolsService,
    private socialSharing: SocialSharing,
    private el: ElementRef
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
    this.userId = await this.toolService.getSecureStorage<string>(
      "userId",
      "0"
    );

    this.code_expiry = await this.toolService.getSecureStorage<any>(
      "codeExpiry",
      null
    );

    // Comentado para evitar que se abra la lista de contactos
    // this.openVisitorModal();

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
    this.myVisitors = await this.toolService.getSecureStorage<any>(
      "visitors",
      null
    );
    this.myVisitors = await this.toolService.sortJsonVisitors(
      this.myVisitors,
      "name",
      true
    );
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

    this.toolService.setSecureStorage(
      "visitors",
      JSON.stringify(this.myVisitors)
    );
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

    const coreSim = await this.toolService.getSecureStorage<string>(
      "coreSim",
      ""
    );
    const userSim = await this.toolService.getSecureStorage<string>("sim", "");
    const coreName = await this.toolService.getSecureStorage<string>(
      "coreName",
      ""
    );

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

        const pkg = {
          code: this.code,
          sim: this.visitorSim,
          initial: this.toolService.convDate(new Date(this.initial)),
          expiry: this.toolService.convDate(new Date(this.expiry)),
          visitorSim: "n/a",
          visitorName: "n/a",
          comment: this.localComment,
          userId: this.userId,
          device_plaform: this.StrPlatform,
        };

        try {
          this.api.postData("api/codes/" + this.userId, pkg).then(
            async (resp: any) => {
              //------- Uncomment, just to fix bug
              if (resp.data) {
                resp.data.expired = false;
                resp.data.range = (
                  (new Date(resp.data.expiry).getTime() -
                    new Date().getTime()) /
                  3600000
                ).toFixed(1);
              }

              this.codeCreated = resp.data;

              this.closeModal();

              return;

              const respId = await Object.values(resp)[1];

              // #region Send code to Core  ----------------------

              const pckgToCore =
                "codigo," +
                (await this.getTimestamp()) +
                "," +
                this.code +
                "," +
                this.toolService.convDate(new Date(this.expiry)) +
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
              // this.loadingController.dismiss();
              this.loadingController.getTop().then((loader) => {
                if (loader) loader.dismiss();
              });
              this.toolService.showAlertBasic(
                "",
                "Can not create code",
                "error: " + error,
                ["Ok"]
              );
            }
          );
        } catch (err) {
          // this.loadingController.dismiss();
          this.toolService.showAlertBasic(
            "",
            "Can not create code",
            "error: " + err,
            ["Ok"]
          );
        }
      })
      .catch((err: any) => {
        console.log("error: ", err);
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

    const use_twilio = await this.toolService.getSecureStorage<any>(
      "twilio",
      null
    );

    try {
      await this.sms.send(sim, text);
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

  async shareImage_New_repetida(canvas: HTMLCanvasElement) {
    const base64 = canvas.toDataURL(); // Imagen del QR
    const mensaje = `Hola ${this.visitorCode}, tu código de acceso es: ${this.code}`;

    // En Android, el nombre del paquete de SMS suele ser 'com.google.android.apps.messaging'
    // o 'com.android.mms'. Para WhatsApp es 'com.whatsapp'.

    const appName = this.platform.is("android")
      ? "com.google.android.apps.messaging"
      : "sms";

    this.socialSharing
      .shareVia(
        appName,
        mensaje,
        "subject se puede personalizar", // Subject
        base64, // AQUÍ SÍ VA LA IMAGEN
        "uri se puede personalizar" // URL
      )
      .then(async () => {
        await this.onSubmitTemplate(false);
      })
      .catch(async (err) => {
        // Si falla por el nombre del paquete, usamos el share general pero con los datos listos
        console.log("Error con app específica, intentando share general");
        this.socialSharing.share(
          mensaje,
          "se puede personalizar",
          base64,
          "se piuede personalizar"
        );
      });
  }

  async shareImage_New_soloTexto(canvas: HTMLCanvasElement) {
    console.log("Llegue hasta shareImage...");
    const base64 = canvas.toDataURL(); // Imagen del QR
    const mensaje = `Hola ${this.visitorCode}, tu código de acceso es: ${this.code}`;

    // La función espera: shareViaSMS(message, phoneNumber)
    this.socialSharing
      .shareViaSMS(mensaje, this.visitorSim)
      .then(async () => {
        console.log("SMS App abierta con éxito");
        await this.onSubmitTemplate(false);
      })
      .catch((err) => {
        this.toolService.toastAlert(
          "Error al abrir SMS: " + err,
          2000,
          ["Ok"],
          "bottom"
        );
      });
  }

  // Pruebas para obtener el numero de celular
  async shareImage_Pruebas(canvas: HTMLCanvasElement) {
    let base64 = canvas.toDataURL();
    let path = "qr.png";

    const loading = await this.loadingController.create({
      message: "Preparando envío...",
      translucent: true,
    });
    await loading.present();

    try {
      const res = await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Cache,
      });

      console.log("this.visitorCode: ", this.visitorCode);

      // Abrimos la hoja de compartir.
      // El usuario elegirá WhatsApp/SMS y buscará el nombre (que ya sabe quién es)
      await Share.share({
        title: "Tu Código de Acceso",
        text: `Hola ${this.visitorCode}, aquí tienes tu código: ${this.code}`,
        url: res.uri,
        dialogTitle: "Enviar QR a Visitante",
      });

      // IMPORTANTE: Una vez que regresa de compartir, guardamos en MongoDB
      // Aquí es donde vinculamos el QR generado con el número de la agenda
      await this.onSubmitTemplate(false);
    } catch (err) {
      console.error("Error al compartir:", err);
    } finally {
      loading.dismiss();
    }
  }

  async shareImage(canvas: HTMLCanvasElement) {
    let base64 = canvas.toDataURL();
    let path = "qr.png";
    console.log("entre a shareImage 1");
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
    const alert = await this.alertController.create({
      header: "Seleccionar Contacto",
      buttons: [
        {
          text: "Agenda del Teléfono",
          handler: () => {
            this.pickNativeContact();
          },
        },
        {
          text: "Lista de Visitantes",
          handler: () => {
            this.openInternalVisitorList();
          },
        },
        {
          text: "Cancelar",
          role: "cancel",
        },
      ],
    });

    await alert.present();
  }

  // Nueva función para abrir la agenda nativa
  async pickNativeContact() {
    try {
      const permission = await Contacts.requestPermissions();

      if (permission.contacts !== "granted") {
        const request = await Contacts.requestPermissions();
        if (request.contacts !== "granted") return;
      }

      const result = await Contacts.pickContact({
        projection: {
          name: true,
          phones: true,
        },
      });

      if (result.contact) {
        // Guardamos el nombre y el número (limpiando espacios)
        this.selectedVisitor = {
          name: result.contact.name?.display || "Visitante",
          sim:
            (result.contact.phones?.[0]?.number ?? "").replace(/\s+/g, "") ||
            "",
        };

        // Actualizamos las variables que usa tu formulario y el QR
        this.visitorCode = this.selectedVisitor.name;
        this.visitorSim = this.selectedVisitor.sim;

        this.toolService.toastAlert(
          "Contacto cargado: " + this.visitorSim,
          1500,
          ["Ok"],
          "bottom"
        );
      }
    } catch (error) {
      console.error("Error seleccionando contacto:", error);
    }
  }

  // Tu lógica original movida a una función aparte
  async openInternalVisitorList() {
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

  async openVisitorModal_() {
    console.log("entre a openVisitorModal");
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

  async closeModal_borrar() {
    console.log("antes de cerrar modal:", this.codeCreated);
    // Buscamos el elemento HTML 'ion-modal' que contiene a este componente
    const modalElement = this.el.nativeElement.closest("ion-modal");

    if (modalElement) {
      // Usamos el método dismiss directamente del elemento HTML
      await modalElement.dismiss(this.codeCreated);
    } else {
      // Si falló lo anterior, intentamos el método tradicional como último recurso
      console.error("Fallo búsqueda por DOM, intentando controller...");
      await this.modalController.dismiss(this.codeCreated);
    }
  }

  async closeModal() {
    await this.loadingController.dismiss();
    const loader = await this.modalController.getTop();
    if (loader) {
      await loader.dismiss(this.codeCreated);
    }
  }
}
