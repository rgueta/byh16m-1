import { Component, OnInit, Input, inject } from "@angular/core";
import { CommonModule, NgFor, NgIf } from "@angular/common";
import { Observable, from, of } from "rxjs";
import {
  FormsModule,
  FormGroup,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import {
  ModalController,
  AlertController,
  LoadingController,
  PopoverController,
  IonicModule,
} from "@ionic/angular";
import {
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
} from "@ionic/angular/standalone";
import { DatabaseService } from "../../services/database.service";
import { SMS, SmsOptions } from "@ionic-native/sms/ngx";
import { ToolsService } from "../../services/tools.service";
import { addIcons } from "ionicons";
import { arrowBackCircleOutline } from "ionicons/icons";

@Component({
  selector: "app-upd-users",
  templateUrl: "./upd-users.page.html",
  styleUrls: ["./upd-users.page.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    NgFor,
    NgIf,
  ],
})
export class UpdUsersPage implements OnInit {
  private modalController = inject(ModalController);
  private api = inject(DatabaseService);
  private sms = inject(SMS);
  private toolService = inject(ToolsService);
  public alertCtrl = inject(AlertController);
  private loadingController = inject(LoadingController);
  private popoverCtrl = inject(PopoverController);
  private fb = inject(FormBuilder);
  RegisterForm: FormGroup | any;
  @Input() cpu: string = "";
  @Input() core: string = "";
  @Input() name: string = "";
  @Input() username: string = "";
  @Input() email: string = "";
  // @Input() sim: string = "";
  @Input() house: string = "";
  @Input() roles: any = [];
  @Input() avatar: string = "";
  @Input() localComment: string = "";

  // Datos recividos de la pagina madre
  @Input() sourcePage!: any;
  @Input() coreId!: any;
  @Input() coreName!: any;
  @Input() pathLocation!: any;
  @Input() pkg!: any;

  LocalSim: string = "";
  RoleList: any = [];
  CpuList: any = [];
  CoreList: any = [];

  coreSim: string = "";
  public gender = "";
  localRole: any = [];
  localCpu: any;
  localCore: any;
  pkgUser: any;
  devicePkg: any;
  location = "";
  locationReadonly: boolean = true;
  id: string = "";
  uuid: string = "";
  uuidReadonly: boolean = true;
  demoMode: boolean = false;
  public MyRole: any = "visitor";
  comment: string = "";
  userId: string = "0";

  codeId = "";
  adminEmail = "";
  adminSim = "";
  selectedCpu: any = {};
  selectedCore: any = {};
  deviceUuid: string = "";

  constructor() {
    addIcons({ arrowBackCircleOutline });

    if (this.MyRole == "admin") {
      this.RegisterForm.addControl(
        "Roles",
        new FormControl("NA", [Validators.required])
      );
    }
  }

  get sim() {
    return this.RegisterForm.get("Sim");
  }

  async ngOnInit() {
    if (this.pkg) {
      console.log("Trae pkg --> ", this.pkg);
    }

    console.log(`Entre upd-users, sourcePage: ${this.sourcePage},
      CoreName: ${this.coreName}, CoreId: ${this.coreId},
      pathLocation: ${this.pathLocation}`);

    if (this.sourcePage == "login") {
      this.RegisterForm = this.fb.group({
        Cpu: [""],
        Core: ["", [Validators.required]],
        Name: ["", [Validators.required]],
        UserName: ["", [Validators.required]],
        Email: ["", [Validators.required]],
        Sim: ["", [Validators.required, this.phoneValidator()]],
        House: ["", [Validators.required]],
        Gender: ["", [Validators.required]],
        Location: [""],
        Comment: [""],
      });
    } else {
      this.RegisterForm = this.fb.group({
        Cpu: [""],
        Core: ["", [Validators.required]],
        Name: ["", [Validators.required]],
        UserName: ["", [Validators.required]],
        Email: ["", [Validators.required]],
        Sim: ["", [Validators.required, this.phoneValidator()]],
        House: ["", [Validators.required]],
        Gender: ["", [Validators.required]],
        Roles: [[], [Validators.required]],
        Location: [""],
        Uuid: ["", [Validators.required]],
      });
    }

    //   getting userId ---------------------------
    this.userId = await this.toolService.getSecureStorage<string>(
      "userId",
      "0"
    );

    if (
      this.sourcePage == "adminNewUser" ||
      this.sourcePage == "adminNewExtrange"
    ) {
      this.RegisterForm.get("Cpu")!.setValue("byh16");
      this.RegisterForm.get("Core")!.setValue(this.coreId!);
      this.getRoles();
    }

    this.demoMode = await this.toolService.getSecureStorage<any>(
      "demoMode",
      null
    );

    this.coreId = this.toolService.getSecureStorage<number>("coreId", 0);

    this.MyRole = await this.toolService.getSecureStorage<string>("myRole", "");

    this.devicePkg = await this.toolService.getSecureStorage<any>(
      "deviceInfo",
      null
    );

    if (this.MyRole == "admin") {
      const rolesData = await this.toolService.getSecureStorage<any>(
        "roles",
        null
      );
      this.RoleList = JSON.parse(rolesData).results;
    }

    this.location = await this.toolService.getSecureStorage<string>(
      "location",
      ""
    );

    this.deviceUuid = await this.toolService.getSecureStorage<string>(
      "deviceUuid",
      ""
    );

    if (this.sourcePage != "login") {
      this.RegisterForm.get("Uuid")!.setValue(this.deviceUuid);
    }

    const admin_email = await this.toolService.getSecureStorage<string>(
      "adminEmail",
      ""
    );

    this.adminSim = await this.toolService.getSecureStorage<string>(
      "adminSim",
      ""
    );

    // getCpus -------
    if (
      this.sourcePage == "login" ||
      this.sourcePage == "adminNew" ||
      this.sourcePage == "adminNewExtrange"
    ) {
      this.api.getData(`api/cpus/${this.userId}`).subscribe({
        next: async (result: any) => {
          this.CpuList = result.results;
        },
        error: (error: any) => {
          this.toolService.showAlertBasic(
            "Alerta",
            "Error, getCpus: ",
            JSON.stringify(error),
            ["Ok"]
          );
        },
      });
    }
  }

  async ionViewWillEnter() {
    if (this.sourcePage == "adminNewExtrange") {
      this.RegisterForm.get("House")!.setValue("NA");
      this.RegisterForm.controls["Cpu"].clearValidators();
      this.RegisterForm.controls["Core"].clearValidators();
      this.RegisterForm.controls["UserName"].clearValidators();
      this.RegisterForm.controls["Email"].clearValidators();
      this.RegisterForm.controls["House"].clearValidators();
      this.RegisterForm.controls["Gender"].clearValidators();
      this.RegisterForm.controls["Location"].clearValidators();
    }

    if (this.demoMode) {
      this.RegisterForm.get("Name").setValue("Vecino");
      this.RegisterForm.get("UserName").setValue("Vecino");
      this.RegisterForm.get("Email").setValue(this.adminEmail);
      this.RegisterForm.get("Sim").setValue("+52664");
    }
  }

  async fillData() {
    this.id = this.pkgUser["id"];
    this.name = this.pkgUser["name"];
    this.username = this.pkgUser["username"];
    this.email = this.pkgUser["email"];
    this.LocalSim = this.pkgUser["sim"];
    this.house = this.pkgUser["house"];
    this.gender = this.pkgUser["gender"];
    this.location = this.pkgUser["path"];
    this.uuid = this.pkgUser["uuid"];
    this.coreSim = this.pkgUser["coreSim"];

    this.RegisterForm.get("Cpu")!.setValue(this.pkgUser["cpu"]);
    this.RegisterForm.get("Core")!.setValue(this.pkgUser["core"]);
    this.RegisterForm.get("Name")!.setValue(this.name);
    this.RegisterForm.get("UserName")!.setValue(this.username);
    this.RegisterForm.get("Email")!.setValue(this.email);
    this.RegisterForm.get("Sim")!.setValue(this.LocalSim);
    this.RegisterForm.get("House")!.setValue(this.house);
    this.RegisterForm.get("Gender")!.setValue(this.gender);
    this.RegisterForm.get("Location")!.setValue(this.location);
    this.RegisterForm.get("Uuid")!.setValue(this.pkgUser["uuid"]);
  }

  async getCores(cpu: string) {
    this.api.getData(`api/cores/cpu/${cpu}/${this.userId}`).subscribe({
      next: async (result: any) => {
        console.log("coreList: ", result.results);
        this.CoreList = await result.results;
      },
      error: (error: any) => {
        this.toolService.showAlertBasic(
          "Alerta",
          "Error, getCores: ",
          error.message,
          ["Ok"]
        );
      },
    });
  }

  async getRoles() {
    let url = "api/roles/";
    if (this.sourcePage == "tab1NewNeighbor") {
      url = "api/roles/newAdmin/";
    }

    this.api.getData(url + this.userId).subscribe({
      next: async (result: any) => {
        this.RoleList = await result.results;
      },
      error: (error: any) => {
        this.toolService.showAlertBasic(
          "Alerta",
          "Error, getRoles: ",
          JSON.stringify(error),
          ["Ok"]
        );
      },
    });
  }

  DemoMode() {
    this.demoMode = !this.demoMode;
    this.toolService.setSecureStorage("demoMode", this.demoMode.toString());
  }

  showLoading(duration: number) {
    this.loadingController
      .create({
        message: "Espere por favor...",
        duration: duration,
        translucent: true,
      })
      .then((res) => {
        res.present();
      });
  }

  async onChangeCpu(event: any) {
    this.selectedCpu = event.detail.value;
    console.log("selectedCpu: ", this.selectedCpu);
    this.getCores(event.detail.value.id);
  }

  async onChangeCore(event: any) {
    this.selectedCore = event.detail.value;
    this.location =
      (await this.selectedCpu.location) + "." + this.selectedCore.shortName;

    this.RegisterForm.get("Location")!.setValue(this.location);
  }

  async onSubmit() {
    const localCpu =
      typeof this.RegisterForm.get("Cpu")!.value == "object"
        ? this.RegisterForm.get("Cpu")!.value["id"]
        : this.RegisterForm.get("Cpu")!.value;

    const localCore =
      typeof this.RegisterForm.get("Core")!.value == "object"
        ? this.RegisterForm.get("Core")!.value["id"]
        : this.RegisterForm.get("Core")!.value;

    const pkg = {
      email: this.RegisterForm.get("Email")!.value,
      username: this.RegisterForm.get("UserName")!.value,
      pwd: "",
      name: this.RegisterForm.get("Name")!.value,
      house: this.RegisterForm.get("House")!.value,
      sim: this.RegisterForm.get("Sim")!.value,
      gender: this.RegisterForm.get("Gender")!.value,
      avatar: "",
      coreId: localCore,
      location: this.location,
      locked: 0,
      uuid: this.RegisterForm.get("Uuid")?.value,
      blocked: 0,
      roles: this.RegisterForm.get("Roles")?.value,
      // note: this.RegisterForm.get("Comment")!.value,
      adminEmail: await this.toolService.getSecureStorage<string>(
        "adminEmail",
        ""
      ),
      demo: this.demoMode,
    };

    pkg.roles = pkg.roles.map((role: any) => role.id);

    console.log("pkg:", pkg);

    try {
      this.showLoading(2500);
      //  add new user
      await this.api
        .postData("api/users/new/" + this.userId, pkg)
        .then(async (resUser: any) => {
          // create password reset

          if (this.MyRole == "admin" || this.MyRole == "neighborAdmin") {
            const options: SmsOptions = {
              replaceLineBreaks: false,
              android: {
                intent: "",
              },
            };
            const pkgDevice =
              "newUser," +
              (await this.getTimestamp()) +
              "," +
              this.RegisterForm.get("Name")!.value +
              "," +
              this.RegisterForm.get("House")!.value +
              "," +
              this.RegisterForm.get("Sim")!.value +
              "," +
              resUser["id"] +
              "," +
              this.localRole[0]["name"];

            await this.sms
              .send(this.coreSim, pkgDevice, options)
              .then()
              .catch((e: any) =>
                this.toolService.showAlertBasic(
                  "Error",
                  "Adding newUser error",
                  e,
                  ["Ok"]
                )
              );
          }
        })
        .catch((rej) => {
          this.toolService.showAlertBasic(
            "Alert",
            "Error api call",
            "Can not add user, " + JSON.stringify(rej["error"]["details"]),
            ["Ok"]
          );
        });
    } catch (err) {
      console.log("error final catch", err);
    }

    // exit model
    await this.modalController.dismiss();
  }

  async sendToDevice(sim: string) {}

  async onSubmitItSelf() {
    const pkg: {} = {
      email: this.RegisterForm.get("Email")!.value,
      username: this.RegisterForm.get("UserName")!.value,
      pwd: "",
      name: this.RegisterForm.get("Name")!.value,
      house: this.RegisterForm.get("House")!.value,
      sim: this.RegisterForm.get("Sim")!.value,
      gender: this.RegisterForm.get("Gender")!.value,
      avatar: "",
      coreId: this.selectedCore.id,
      location: this.location,
      locked: 0,
      uuid: this.deviceUuid,
      blocked: 0,
      roles: [4],
      // device: JSON.parse(this.devicePkg),

      // note: this.RegisterForm.get("Comment")!.value,
      adminEmail: await this.toolService.getSecureStorage<string>(
        "adminEmail",
        ""
      ),
      demo: this.demoMode,
    };

    let alert = await this.alertCtrl.create({
      message: "Mandar solicitud ?",
      buttons: [
        {
          text: "No",
          role: "cancel",
          handler: () => {},
        },
        {
          text: "Si",
          handler: async () => {
            try {
              const response = await this.sendUserReq(pkg);
              if (response && response.success) {
                this.modalController.dismiss({
                  success: true,
                  data: response.data,
                });
              }
            } catch (err: any) {}
          },
        },
      ],
    });

    return await alert.present();
  }

  async sendUserReq(pkg: any): Promise<any> {
    this.showLoading(2500);
    try {
      const result = await this.api.postData("api/users/new/0", pkg);
      return { success: true, data: result };
    } catch (err: any) {
      this.toolService.showAlertBasic("", "Error", err.error.details, ["Ok"]);
      throw err;
    }
  }

  async closeModal() {
    var empty: Boolean = true;
    const comment = document.getElementById("comment");
    if (
      this.RegisterForm.get("Cpu").value != "" ||
      this.RegisterForm.get("Core").value != "" ||
      this.RegisterForm.get("Name").value != "" ||
      this.RegisterForm.get("UserName").value != "" ||
      this.RegisterForm.get("Email").value != "" ||
      this.RegisterForm.get("Sim").value != "" ||
      this.RegisterForm.get("House").value != "" ||
      this.RegisterForm.get("Gender").value != "" ||
      this.RegisterForm.get("Comment").value != ""
    ) {
      empty = false;
    }

    if (!empty) {
      let alert = await this.alertCtrl.create({
        subHeader: "Se perdera la informacion",
        message: "Deseas salir ?",
        buttons: [
          {
            text: "No",
            role: "cancel",
            handler: () => {},
          },
          {
            text: "Si",
            handler: async () => {
              this.modalController.dismiss();
            },
          },
        ],
      });

      return await alert.present();
    } else {
      this.modalController.dismiss();
    }
  }

  async getTimestamp() {
    var myDate = new Date();
    var offset = myDate.getTimezoneOffset() * 60 * 1000;

    var withOffset = myDate.getTime();
    var withoutOffset = withOffset - offset;

    return withoutOffset;
  }

  async newExtrange() {
    let coreSim = await this.toolService.getSecureStorage<string>(
      "coreSim",
      ""
    );

    const options: SmsOptions = {
      replaceLineBreaks: false,
      android: {
        intent: "",
      },
    };

    let alert = await this.alertCtrl.create({
      subHeader: "Agregar ",
      message: "Agregar extrange ?",
      buttons: [
        {
          text: "No",
          role: "cancel",
          handler: () => {},
        },
        {
          text: "Si",
          handler: async () => {
            const pkgDevice =
              "blockExtrange," +
              (await this.getTimestamp()) +
              "," +
              this.RegisterForm.get("Name")!.value +
              "," +
              this.RegisterForm.get("Sim")!.value +
              "," +
              this.userId;

            console.log("pkgDevice: ", pkgDevice);
            return;
            await this.sms
              .send(coreSim!, pkgDevice, options)
              .then(() => {
                // exit model
                this.modalController.dismiss();
              })
              .catch((e: any) =>
                this.toolService.showAlertBasic(
                  "Error",
                  "Falla conexion a red telefonica",
                  "",
                  ["Ok"]
                )
              );
          },
        },
      ],
    });

    return await alert.present();
  }

  async onChangeComment(event: any) {
    this.localComment = event;
  }

  async newComment() {
    let alert = await this.alertCtrl.create({
      subHeader: "Confirmar",
      message: "Mandar comentario ?",
      buttons: [
        {
          text: "No",
          role: "cancel",
          handler: () => {},
        },
        {
          text: "Si",
          handler: async () => {
            const coreId = this.coreId;
            const userId = this.userId;

            try {
              this.api
                .postData("api/commentsApp/new/" + coreId + "/" + userId, {
                  comment: this.localComment,
                })
                .then(
                  async (resp: any) => {
                    const respId = await Object.values(resp)[1];

                    this.loadingController.dismiss();
                    this.closeModal();
                  },
                  (error) => {
                    this.loadingController.dismiss();
                    this.toolService.showAlertBasic(
                      "",
                      "Can not sent comment",
                      "error: " + JSON.stringify(error),
                      ["Ok"]
                    );
                  }
                );
            } catch (err) {
              this.loadingController.dismiss();
              this.toolService.showAlertBasic(
                "",
                "Can not sent comment",
                "error: " + err,
                ["Ok"]
              );
            }
          },
        },
      ],
    });

    return await alert.present();
  }

  // Validador personalizado para teléfono
  phoneValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = control.value.toString().trim();
      // Eliminar espacios, guiones, paréntesis y el signo +
      const cleanValue = value.replace(/[\s\-\(\)\+]/g, "");

      // Validar diferentes formatos
      const patterns = [
        /^\d{9}$/, // 9 dígitos (Perú)
        /^\d{10}$/, // 10 dígitos
        /^\d{11}$/, // 11 dígitos (Brasil)
        /^9\d{8}$/, // Específico Perú: 9 seguido de 8 dígitos
        /^\d{9,15}$/, // Entre 9 y 15 dígitos (formato internacional sin +)
      ];

      const isValid = patterns.some((pattern) => pattern.test(cleanValue));

      return isValid ? null : { invalidPhone: true };
    };
  }
}
