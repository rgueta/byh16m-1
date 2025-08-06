import { Component, OnInit, Input } from "@angular/core";
import { CommonModule, NgFor, NgIf } from "@angular/common";
import { Observable, from, of } from "rxjs";
import {
  FormsModule,
  FormGroup,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
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
    IonTextarea,
    ReactiveFormsModule,
    IonicModule,
    NgFor,
    NgIf,
  ],
})
export class UpdUsersPage implements OnInit {
  RegisterForm: FormGroup | any;
  @Input() cpu: string = "";
  @Input() core: string = "";
  @Input() name: string = "";
  @Input() username: string = "";
  @Input() email: string = "";
  @Input() sim: string = "";
  @Input() house: string = "";
  @Input() roles: any = [];
  @Input() avatar: string = "";
  @Input() localComment: string = "";

  // Datos recividos de la pagina madre
  @Input() sourcePage!: any;
  @Input() coreId!: any;
  @Input() coreName!: any;
  @Input() pathLocation!: any;

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
  location: string | null = "";
  locationReadonly: boolean = true;
  id: string = "";
  uuid: string = "";
  uuidReadonly: boolean = true;
  demoMode: boolean = false;
  public MyRole: any = "visitor";
  comment: string = "";
  userId: string | null = "";

  codeId = "";

  constructor(
    private modalController: ModalController,
    private api: DatabaseService,
    private sms: SMS,
    private toolService: ToolsService,
    public alertCtrl: AlertController,
    private loadingController: LoadingController,
    private popoverCtrl: PopoverController,
    private fb: FormBuilder
  ) {
    addIcons({ arrowBackCircleOutline });

    this.RegisterForm = this.fb.group({
      Cpu: [""],
      Core: ["", [Validators.required]],
      Name: ["", [Validators.required]],
      UserName: ["", [Validators.required]],
      Email: ["", [Validators.required]],
      Sim: ["", [Validators.required]],
      House: ["", [Validators.required]],
      Gender: ["", [Validators.required]],
      Roles: [[], [Validators.required]],
      Location: [""],
      Uuid: ["", [Validators.required]],
    });

    if (this.MyRole == "admin") {
      this.RegisterForm.addControl(
        "Roles",
        new FormControl("NA", [Validators.required])
      );
    }
  }

  ngOnInit() {
    console.log(`Entre upd-users, sourcePage: ${this.sourcePage},
      CoreName: ${this.coreName}, CoreId: ${this.coreId},
      pathLocation: ${this.pathLocation}`);

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

    this.toolService.getSecureStorage("myRole").subscribe({
      next: async (result) => {
        this.MyRole = result;
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

    this.toolService.getSecureStorage("deviceInfo").subscribe({
      next: async (result) => {
        this.devicePkg = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo deviceInfo en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    if (this.MyRole == "admin") {
      let valueRoles: any | null = null;

      this.toolService.getSecureStorage("roles").subscribe({
        next: async (result) => {
          this.RoleList = await JSON.parse(result!);
        },
        error: (err) => {
          this.toolService.toastAlert(
            "error, obteniendo roles en getSecureStorage: " + err,
            0,
            ["Ok"],
            "middle"
          );
        },
      });
    }

    this.toolService.getSecureStorage("location").subscribe({
      next: async (result) => {
        this.location = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo location en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    this.toolService.getSecureStorage("deviceUuid").subscribe({
      next: async (result) => {
        this.RegisterForm.get("Uuid")!.setValue(result);
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
  }

  async ionViewWillEnter() {
    if (this.MyRole == "admin" || this.MyRole == "neighborAdmin") {
      console.log("Entre en ---- > ionViewWillEnter: ");
      this.RegisterForm.get("Cpu")!.setValue("byh16");
      this.RegisterForm.get("Core")!.setValue(this.coreId);
      this.getRoles();
    }

    if (
      this.sourcePage == "login" ||
      this.sourcePage == "adminNew" ||
      this.sourcePage == "adminNewExtrange"
    ) {
      this.getCpus();
    }

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
  }

  async fillData() {
    this.id = this.pkgUser["_id"];
    this.name = this.pkgUser["name"];
    this.username = this.pkgUser["username"];
    this.email = this.pkgUser["email"];
    this.sim = this.pkgUser["sim"];
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
    this.RegisterForm.get("Sim")!.setValue(this.sim);
    this.RegisterForm.get("House")!.setValue(this.house);
    this.RegisterForm.get("Gender")!.setValue(this.gender);
    this.RegisterForm.get("Location")!.setValue(this.location);
    this.RegisterForm.get("Uuid")!.setValue(this.pkgUser["uuid"]);
  }

  async getCpus() {
    this.api.getData("api/cpus/").subscribe({
      next: async (result) => {
        this.CpuList = result;
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

  async getCores(cpu: string) {
    this.api.getData("api/cores/" + cpu).subscribe({
      next: async (result: any) => {
        this.CoreList = await result;
      },
      error: (error: any) => {
        this.toolService.showAlertBasic(
          "Alerta",
          "Error, getCores: ",
          JSON.stringify(error),
          ["Ok"]
        );
      },
    });
  }

  async getRoles() {
    let url = "api/roles/";
    if (this.sourcePage == "tab1NewNeighbor") {
      url = "api/roles/neiAdmin/";
    }

    this.api.getData(url + this.userId).subscribe({
      next: async (result: any) => {
        this.RoleList = await result;
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

  async onChangeCpu() {
    this.getCores(this.localCpu["id"]);
    this.location = this.localCpu["location"];
  }

  async onChangeCore() {
    this.location =
      this.localCpu["location"] + "." + this.localCore["shortName"];
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

    let email: any;

    if (this.demoMode) {
      this.toolService.getSecureStorage("adminEmail").subscribe({
        next: (result) => {
          email = result;
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

      email = JSON.parse(email!)[0]["email"];
    } else {
      email = this.RegisterForm.get("Email")!.value;
    }

    const pkg = {
      cpu: localCpu,
      core: localCore,
      name: this.RegisterForm.get("Name")!.value,
      username: this.RegisterForm.get("UserName")!.value,
      pwd: "",
      email: email,
      sim: this.RegisterForm.get("Sim")!.value,
      house: this.RegisterForm.get("House")!.value,
      gender: this.RegisterForm.get("Gender")!.value,
      roles: this.RegisterForm.get("Roles")?.value,
      uuid: this.RegisterForm.get("Uuid")?.value,
      location: this.location,
      avatar: "",
    };

    pkg.roles = pkg.roles.map((role: any) => role.id);

    try {
      this.showLoading(2500);
      //  add new user
      await this.api
        .postData("api/users/new/" + this.userId, pkg)
        .then(async (resUser: any) => {
          // create password reset

          this.api
            .postData("api/pwdResetReq/" + email, JSON.parse(this.devicePkg))
            .then(async (result) => {
              if (this.MyRole == "admin" || this.MyRole == "neighborAdmin") {
                // delete backstage document
                this.api
                  .deleteData("api/backstage/" + this.userId + "/" + this.id)
                  .then(async (result) => {
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
                      resUser["_id"] +
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
                  })
                  .catch((err) => {
                    this.toolService.showAlertBasic(
                      "Alerta",
                      "Error, delete backstage: ",
                      JSON.stringify(err),
                      ["Ok"]
                    );
                  });
              }
            })
            .catch((err) => {
              this.toolService.showAlertBasic(
                "Alerta",
                "Error, pwd reset: ",
                JSON.stringify(err),
                ["Ok"]
              );
            });
        })
        .catch((rej) => {
          this.toolService.showAlertBasic(
            "Alert",
            "Error api call",
            "Can not add user, " + JSON.stringify(rej["error"]["msg"]),
            ["Ok"]
          );
        });

      this.toolService.showAlertBasic(
        "",
        "Se agrego el usuario:",
        this.RegisterForm.get("Name")!.value,
        ["Ok"]
      );

      // exit model
      this.modalController.dismiss("refresh");
    } catch (err) {
      console.log("error final catch", err);
    }
  }

  async sendToDevice(sim: string) {}

  async onSubmitItSelf(
    cpu: string,
    core: string,
    name: string,
    username: string,
    email: string,
    sim: string,
    house: string,
    gender: any
  ) {
    const comment = document.getElementById("comment")!;

    const pkg: {} = {
      cpu: this.localCpu["id"],
      core: this.localCore["id"],
      name: name,
      username: username,
      email: email,
      sim: sim,
      house: house,
      gender: gender,
      note: comment.textContent,
      uuid: this.toolService.getSecureStorage("deviceUuid"),
    };

    // >> Confirmation ------------------------------------

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
            if ((await this.sendUserReq(pkg)) == true) {
              this.modalController.dismiss();
            }
          },
        },
      ],
    });

    return await alert.present();

    // << Confirmation  -----------------------------------
  }

  async sendUserReq(pkg: any): Promise<any> {
    let adminSim: any | null = null;

    adminSim = this.toolService.getSecureStorage("adminSim").subscribe({
      next: (result) => {
        adminSim = result;
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo adminSim en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });
    adminSim = JSON.parse(adminSim);

    this.showLoading(2500);
    this.api
      .postData("api/backstage/", pkg)
      .then(async (result: any) => {
        this.toolService.showAlertBasic(
          "",
          "Requerimiento enviado",
          "Pronto recibiras un correo",
          ["Ok"]
        );

        return true;
      })
      .catch((err) => {
        this.toolService.showAlertBasic(
          "",
          "Error",
          JSON.stringify(err["error"]["msg"]),
          ["Ok"]
        );
        return false;
      });
  }

  async closeModal() {
    var empty: Boolean = true;

    if (this.sourcePage == "login") {
      const comment = document.getElementById("comment");
      if (
        this.cpu != "" ||
        this.core ||
        this.name ||
        this.username != "" ||
        this.email != "" ||
        this.sim != "" ||
        this.house != "" ||
        this.gender != "" ||
        comment!.textContent != ""
      ) {
        empty = false;
      }
    } else {
      if (
        this.name ||
        this.username != "" ||
        this.email != "" ||
        this.sim != "" ||
        this.house != "" ||
        this.gender != ""
      ) {
        empty = false;
      }
    }

    if (!empty) {
      // >> Confirmation ------------------------------------

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

      // << Confirmation  -----------------------------------
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
    let coreSim: string | null = "";

    //   getting demoMode ---------------------------
    this.toolService.getSecureStorage("coreSim").subscribe({
      next: (result) => {
        coreSim = result;
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

  async onChangeComment($event: any) {
    this.localComment = $event;
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
}
