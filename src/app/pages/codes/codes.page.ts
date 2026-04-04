import { Component, OnInit } from "@angular/core";
import { DatabaseService } from "../../services/database.service";
import {
  AnimationController,
  AlertController,
  IonicModule,
} from "@ionic/angular";
import { UpdCodesPage } from "../../modals/upd-codes/upd-codes.page";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SMS, SmsOptions } from "@ionic-native/sms/ngx";
import { environment } from "src/environments/environment";
import { ToolsService } from "../../services/tools.service";
import { Router } from "@angular/router";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonItem,
  IonDatetime,
  IonModal,
  IonIcon,
  IonNote,
  IonRange,
  IonList,
  IonFabButton,
  IonFab,
  IonRefresherContent,
  IonRefresher,
  IonDatetimeButton,
  IonBadge,
  IonListHeader,
  IonButton,
  IonCard,
  IonCardContent,
  ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  chevronUpOutline,
  chevronDownOutline,
  calendarOutline,
  addOutline,
  chevronForwardOutline,
  lockClosedOutline,
  chevronForward,
  calendarClearOutline,
  chevronDown,
} from "ionicons/icons";

@Component({
  selector: "app-codes",
  templateUrl: "./codes.page.html",
  styleUrls: ["./codes.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonLabel,
    IonItem,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonDatetime,
    IonModal,
    IonIcon,
    IonNote,
    IonRange,
    IonList,
    IonFabButton,
    IonFab,
    IonRefresherContent,
    IonRefresher,
  ],
})
export class CodesPage implements OnInit {
  CodeList: any;
  private codigosCargados = false;
  myToast: any;
  userId = {};
  automaticClose = false;
  codeEnabled: any;

  initial: any;
  // expiry : any;
  diff: any;
  myRoles: {} = {};
  myToken: any;
  load_codes: boolean = true;
  public MyRole: string = "visitor";
  expiry: any = new Date().toISOString();
  code_expiry: any;
  pkg: any = {};
  demoMode: boolean = false;
  coreSim = "";

  constructor(
    public api: DatabaseService,
    public modalController: ModalController,
    public animationController: AnimationController,
    private sms: SMS,
    public alertCtrl: AlertController,
    public router: Router,
    private toolsService: ToolsService
  ) {
    addIcons({
      chevronUpOutline,
      chevronDownOutline,
      calendarOutline,
      addOutline,
      chevronForwardOutline,
      lockClosedOutline,
      chevronForward,
      calendarClearOutline,
      chevronDown,
    });
  }

  async ngOnInit() {
    //   getting role ---------------------------
    this.MyRole = await this.toolsService.getSecureStorage<string>("role", "");

    //   getting authToken ---------------------------
    this.myToken = await this.toolsService.getSecureStorage<string>(
      "authToken",
      ""
    );

    //   getting userId ---------------------------
    this.userId = await this.toolsService.getSecureStorage<string>(
      "userId",
      "0"
    );

    //   getting roles ---------------------------
    this,
      (this.myRoles = await this.toolsService.getSecureStorage<any>(
        "roles",
        null
      ));

    //   getting codeExpiry ---------------------------
    this.code_expiry = await this.toolsService.getSecureStorage<any>(
      "codeExpiry",
      null
    );

    //   getting coreSim ---------------------------
    this.coreSim = await this.toolsService.getSecureStorage<string>(
      "coreSim",
      ""
    );

    this.initial = new Date();
    this.expiry = new Date(
      new Date().setHours(new Date().getHours() + this.code_expiry)
    );
    this.diff = (
      Math.abs(this.initial.getTime() - this.expiry.getTime()) / 3600000
    ).toFixed(0);

    this.collectCodes();
  }

  async collectCodes() {
    if (this.codigosCargados) {
      return;
    }

    this.api
      .getData("api/codes/user/" + this.userId)
      .subscribe(async (result: any) => {
        this.codigosCargados = true;
        Object.entries(result.results).forEach(async ([_, item]) => {
          const code = item as any;
          if (new Date(code.expiry) < new Date()) {
            code.expired = true;
          } else {
            code.expired = false;
          }

          code.range = (
            (new Date(code.expiry).getTime() - new Date().getTime()) /
            3600000
          ).toFixed(1);
        });

        this.CodeList = result.results;
        this.CodeList[0].open = true;
        this.initial = this.CodeList[0].initial;
        this.expiry = this.CodeList[0].expiry;
      });
  }

  async doRefresh(event: any) {
    this.collectCodes();

    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  toggleSection(index: number) {
    this.CodeList[index].open = !this.CodeList[index].open;
    if (this.automaticClose && this.CodeList[index].open) {
      this.CodeList.filter(
        (item: {}, itemIndex: number) => itemIndex != index
      ).map((item: any) => (item.open = false));
    }
  }

  async onRangeChange(event: any) {
    var expiry = new Date();
    this.diff = event.detail.value;

    this.expiry = expiry.setHours(
      expiry.getHours() + Number(event.detail.value)
    );

    console.log(`Initial: ${new Date()} - Expiry: ${new Date(this.expiry)}
    \n Diff: ${this.diff}`);
  }

  async sendCode(pkg: any) {
    try {
      if (environment.app.debugging_send_sms) {
        await this.sms.send(
          this.coreSim,
          "codigo," +
            this.pkg["code"] +
            "," +
            this.pkg["expiry"] +
            "," +
            this.userId +
            ",n/a," +
            this.pkg["id"]
        );

        this.toolsService.toastAlert("Texto fue enviado", 0, ["Ok"], "middle");
      } else {
        this.toolsService.toastAlert(
          "debugging_send_sms = false",
          0,
          ["Ok"],
          "middle"
        );
      }

      try {
        if (
          await this.toolsService.getSecureStorage<boolean>("netStatus", false)
        ) {
          await this.api.putData(
            "api/codes/update/" + this.userId + "/" + pkg["id"],
            pkg
          );

          this.collectCodes();
        } else {
          this.toolsService.toastAlert(
            "No hay acceso a internet",
            0,
            ["Ok"],
            "middle"
          );
        }
      } catch (err) {
        this.toolsService.showAlertBasic(
          "Aviso",
          "Ocurrio una excepcion",
          "Error: " + err,
          ["Ok"]
        );
      }
    } catch (e: any) {
      this.toolsService.showAlertBasic(
        "Aviso",
        "Ocurrio una excepcion",
        "Error: " + e,
        ["Ok"]
      );
    }
  }

  async ResendCode(code: string, codeId: string, Initial: any, Expiry: any) {
    this.expiry = this.initial = new Date();
    this.initial = this.toolsService.convDate(new Date(this.initial));
    this.pkg = { code: "", id: "", initial: "", expiry: "" };

    this.expiry = this.expiry.setHours(
      this.expiry.getHours() + Number(this.diff)
    );
    this.expiry = this.toolsService.convDate(new Date(this.expiry));

    await this.showAlert(
      "",
      "",
      `Reenviar con ${this.diff} hrs.?`,
      "btns",
      "Si",
      "No"
    );

    var options: SmsOptions = {
      replaceLineBreaks: false,
      android: {
        intent: "",
      },
    };

    this.pkg["code"] = code;
    this.pkg["id"] = codeId;
    this.pkg["initial"] = this.initial;
    this.pkg["expiry"] = this.expiry;
  }

  async onChangeExpiry(codeId: string, initial: any, expiry: any) {
    if (new Date(expiry) <= this.initial) {
      this.toolsService.showAlertBasic(
        "",
        "",
        "Tiempo final debe ser meyor al tiempo inicial",
        ["Cerrar"]
      );
      return;
    } else {
      this.expiry = new Date(expiry);
      this.diff = (
        Math.abs(new Date().getTime() - this.expiry.getTime()) / 3600000
      ).toFixed(1);
      if (this.diff > 0) {
        var arrFound = this.CodeList.find((item: any, i: number) => {
          if (item["id"] == codeId) {
            this.CodeList[i].changed = true;
          }
        });

        this.codeEnabled = true;
      }
    }
  }

  async onChangeInitial(initial: any, expiry: any) {
    console.log("onChangeInitial -> " + initial);
    if (new Date(initial) >= expiry) {
      this.toolsService.showAlertBasic(
        "",
        "",
        "Tiempo inicial debe ser menor al tiempo final",
        ["Cerrar"]
      );
      return;
    } else {
      this.initial = new Date(initial);
      // this.diff =  await (Math.abs(this.initial.getTime() - this.expiry.getTime()) / 3600000).toFixed(1);
      console.log(
        "Initial : " +
          this.toolsService.convDate(this.initial) +
          "\nExpiry :  " +
          this.toolsService.convDate(this.expiry) +
          "\nDiff hrs. " +
          this.diff
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
            await this.sendCode(this.pkg);
          },
        },
      ],
    });

    await alert.present();
  }

  // ---- Animation controller  ----------------------------------

  async addCode() {
    console.log("ON addCode...");
    const modal = await this.modalController.create({
      component: UpdCodesPage,
    });

    await modal.present();

    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        try {
          this.CodeList = [result.data, ...this.CodeList];
          this.CodeList[0].open = true;
          this.CodeList[1].open = false;
          this.initial = this.CodeList[0].initial;
          this.expiry = this.CodeList[0].expiry;
        } catch (err) {
          this.codigosCargados = false;
          await this.collectCodes();
        }
      }
    });
  }
}
