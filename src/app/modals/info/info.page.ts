import { Component, OnInit, Input, inject } from "@angular/core";
import { CommonModule, NgFor, NgIf } from "@angular/common";
import { Capacitor } from "@capacitor/core";
import {
  FormsModule,
  Validators,
  FormControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { addIcons } from "ionicons";
import { arrowBackCircleOutline, imageOutline } from "ionicons/icons";

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { DatabaseService } from "../../services/database.service";
import { environment } from "../../../environments/environment";
import { finalize, lastValueFrom } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { ToolsService } from "../../services/tools.service";
import {
  ModalController,
  LoadingController,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonCardHeader,
  IonButton,
  IonTextarea,
  IonItem,
  IonThumbnail,
  IonRefresher,
  IonRange,
  IonIcon,
  IonLabel,
  IonSelectOption,
  IonRefresherContent,
  IonSelect,
} from "@ionic/angular/standalone";
import { monthlyFolder, encodeUrlSafe } from "../../utils/utils";

interface R2UploadResponse {
  success: boolean;
  url?: string;
  data?: {
    url: string;
    key: string;
    size: number;
    etag?: string;
  };
  error?: string;
  message?: string;
}

interface OfflineQueueItem {
  type: "upload"; // Literal type
  endpoint: string;
  formData: FormData;
  timestamp: string;
  retryCount?: number; // Opcional para manejo de reintentos
}

@Component({
  selector: "app-info",
  templateUrl: "./info.page.html",
  styleUrls: ["./info.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButtons,
    IonCardContent,
    IonCardSubtitle,
    IonCardTitle,
    IonCheckbox,
    IonCardSubtitle,
    IonCardHeader,
    IonButton,
    IonTextarea,
    IonItem,
    IonThumbnail,
    IonRange,
    IonIcon,
    IonLabel,
    IonSelectOption,
    IonRefresherContent,
    ReactiveFormsModule,
    IonRefresher,
    NgFor,
    NgIf,
    IonSelect,
  ],
})
export class InfoPage implements OnInit {
  private fb = inject(FormBuilder);
  private modalController = inject(ModalController);
  public loadingCtrl = inject(LoadingController);
  private api = inject(DatabaseService);
  private http = inject(HttpClient);
  private toolService = inject(ToolsService);
  RegisterForm!: FormGroup;
  imageURI: any;
  imageFileName: any;
  myToast: any;
  userId: string = "0";
  @Input() localTitle: string = "";
  @Input() localDescription: string = "";
  @Input() localUrl: string = "";
  @Input() localCountry: string = "";
  @Input() localState: string = "";
  @Input() localCity: string = "";
  @Input() localDivision: string = "";
  @Input() localCpu: string = "";
  @Input() localCore: string = "";

  public countriesList: any;
  public statesList: any;
  public citiesList: any;
  public divisionsList: any;
  public cpusList: any;
  public coresList: any;
  public imgFolder: string = "";
  public localInfo: any;

  public shortCity: string = "";
  public shortDivision: string = "";
  public shortCpus: string = "";
  public shortCores: string = "";

  localImg: any;
  image: any;

  ImageSize: any;
  ImageQuality: any;

  REST_API_SERVER = environment.cloud.server_url;

  constructor() {
    addIcons({ arrowBackCircleOutline, imageOutline });
    this.validateControls();
  }

  async validateControls() {
    this.RegisterForm = this.fb.group({
      frmCtrl_country: ["", [Validators.required]],
      frmCtrl_state: ["", [Validators.required]],
      frmCtrl_city: ["", [Validators.required]],
      frmCtrl_division: ["", [Validators.required]],
      frmCtrl_cpu: ["", [Validators.required]],
      frmCtrl_core: ["", [Validators.required]],
    });
  }

  async ngOnInit() {
    // this.localTitle = "Aqui va el titulo..";
    // Forzar detección de cambios después de la inicialización

    this.userId = await this.toolService.getSecureStorage<string>(
      "userId",
      "0"
    );

    this.collectCountries();

    this.collectInfo();
  }

  //#region select location  -------------------------------------------
  async collectCountries() {
    this.api.getData("api/countries/" + this.userId).subscribe({
      next: async (result) => {
        this.countriesList = result;
      },
      error: (error: any) => {
        this.toolService.toastAlert(
          "Fallo obteniendo countries: " + error,
          0,
          ["Ok"],
          "middle"
        );
      },
    });
  }

  async collectStates(country: any) {
    this.api.getData("api/states/" + country + "/" + this.userId).subscribe({
      next: async (statesResult) => {
        this.statesList = statesResult;
      },
      error: (error) => {
        this.toolService.showAlertBasic(
          "Aviso",
          "Fallo obteniendo error:",
          `Error: ${error}`,
          ["Cerrar"]
        );
      },
    });
  }

  async collectCities(state: any) {
    this.api
      .getData(
        "api/cities/" + this.localCountry + "/" + state + "/" + this.userId
      )
      .subscribe({
        next: async (citiesResult) => {
          this.citiesList = citiesResult;
        },
        error: (error) => {
          this.toolService.showAlertBasic(
            "Aviso",
            "Fallo obteniendo cities:",
            `Error: ${error}`,
            ["Cerrar"]
          );
        },
      });
  }

  async collectDivisions(city: any) {
    this.api
      .getData(
        "api/divisions/" +
          this.localCountry +
          "/" +
          this.localState +
          "/" +
          city +
          "/" +
          this.userId
      )
      .subscribe({
        next: async (divisionsResult) => {
          this.divisionsList = divisionsResult;
        },
        error: (error) => {
          this.toolService.showAlertBasic(
            "Aviso",
            "Fallo obteniendo divisions:",
            `Error: ${error}`,
            ["Cerrar"]
          );
        },
      });
  }

  async collectCpus(divisionId: any) {
    this.api
      .getData("api/cpus/basic/" + divisionId + "/" + this.userId)
      .subscribe({
        next: async (cpusResult) => {
          this.cpusList = cpusResult;
        },
        error: (error) => {
          this.toolService.showAlertBasic(
            "Aviso",
            "Fallo obteniendo cpus/basic:",
            `Error: ${error}`,
            ["Cerrar"]
          );
        },
      });
  }
  async collectCores(cpuId: any) {
    this.api.getData("api/cores/basic/" + cpuId + "/" + this.userId).subscribe({
      next: async (coresResult) => {
        this.coresList = coresResult;
      },
      error: (error) => {
        this.toolService.showAlertBasic(
          "Aviso",
          "Fallo obteniendo cores light:",
          `Error: ${error}`,
          ["Cerrar"]
        );
      },
    });
  }

  async countrySelection() {
    let country = this.RegisterForm.controls["frmCtrl_country"].value;

    if (country) {
      this.collectStates(country);
      this.localCountry = country;
    } else {
      console.log("no contry selected");
    }

    // this.localCountry = countryObj.name;
  }

  async stateSelection() {
    let state = this.RegisterForm.controls["frmCtrl_state"].value;

    this.collectCities(state);
    this.localState = state;
  }

  async citySelection(event: any) {
    const selectedItem = event.detail.value;

    if (selectedItem) {
      const { id, shortName, name } = selectedItem;
      this.localCity = shortName;
      this.collectDivisions(id);
    }
  }

  async divisionSelection(event: any) {
    const selectedItem = event.detail.value;
    if (selectedItem) {
      const { id, shortName, name } = selectedItem;
      this.localDivision = shortName;
      await this.collectCpus(id);
    }
  }

  async cpuSelection(event: any) {
    const selectedItem = event.detail.value;
    if (selectedItem) {
      const { id, shortName, name } = selectedItem;
      this.localCpu = shortName;
      await this.collectCores(id);
    }
  }

  async coreSelection(event: any) {
    const selectedItem = event.detail.value;
    if (selectedItem) {
      const { id, shortName, name } = selectedItem;
      this.localCore = shortName;
    }

    console.log(`country,state,city,div,cpu,core:
      ${this.localCountry}.
      ${this.localState}.
      ${this.localCity}.
      ${this.localDivision}.
      ${this.localCpu}.
      ${this.localCore}`);

    this.imgFolder =
      this.localCountry +
      "." +
      this.localState +
      "." +
      this.localCity +
      "." +
      this.localDivision +
      "." +
      this.localCpu +
      "." +
      this.localCore;
  }

  //#endregion select location  -------------------------------------------

  async rangeChange(event: any) {
    this.ImageQuality = await event.detail.value;
  }

  //#region Image section ------------------------------------------------

  async getImage() {
    try {
      this.localImg = await Camera.getPhoto({
        quality: this.ImageQuality,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      const dataUrl = this.localImg.dataUrl || "";

      // Convertir DataUrl a Blob para obtener el tamaño real
      const blob = this.dataURLtoBlob(dataUrl);
      this.ImageSize = blob.size;

      if (this.localImg) {
        this.imageFileName = Capacitor.convertFileSrc(this.localImg.dataUrl);
        this.localDescription = "Description";
        this.localUrl = "Local Url";
      }
    } catch (e) {
      console.log("Error getImage: ", e);
    }
  }

  // Nueva seccion para insertar imagenes  ---------------------

  async uploadFile() {
    // Validar que haya imagen
    if (!this.localImg?.dataUrl) {
      this.toolService.toastAlert(
        "No hay imagen seleccionada",
        0,
        ["Ok"],
        "middle"
      );
      return;
    }

    // Convertir dataURL a Blob
    const blob = this.dataURLtoBlob(this.localImg.dataUrl);

    console.log("blob: ", blob);

    // Crear nombre de archivo único para evitar colisiones
    const timestamp = new Date().getTime();
    const fileName = `${
      this.imgFolder
    }/${await monthlyFolder()}/${timestamp}.jpg`;

    // Crear FormData para el upload
    let formData = new FormData();
    formData.append("file", blob, fileName); // ← Importante: el campo debe llamarse "file"
    formData.append("key", fileName); // ← Campo opcional para el nombre en R2
    formData.append("url", this.localUrl);
    formData.append("uploadPath", `${this.imgFolder}/${await monthlyFolder()}`);
    formData.append("location", this.imgFolder);
    formData.append("size", blob.size.toString());
    formData.append("userId", this.userId);

    // Si necesitas enviar metadatos adicionales
    if (this.localTitle) formData.append("title", this.localTitle);
    if (this.localDescription)
      formData.append("description", this.localDescription);

    const loading = await this.loadingCtrl.create({
      message: "Subiendo imagen...",
    });
    await loading.present();

    try {
      const netStatus = await this.toolService.getSecureStorage<boolean>(
        "netStatus",
        false
      );

      if (netStatus) {
        // Para Cloudflare R2 - NO usar headers 'content-type': 'application/json'
        // El navegador automáticamente pondrá el boundary correcto
        const data$ = this.http.post<R2UploadResponse>(
          `${this.REST_API_SERVER}api/r2/upload`,
          formData
          // No incluyas headers, el navegador los maneja automáticamente
        );

        const res = await lastValueFrom(data$);

        if (res && res.success) {
          // Guardar la URL pública de la imagen
          const imageUrl: any = res.data?.url || res.url;

          // Aquí puedes guardar la información en tu base de datos
          await this.saveImageInfo(imageUrl, fileName);

          this.toolService.toastAlert(
            "Imagen subida exitosamente",
            2000,
            ["Ok"],
            "middle"
          );
        } else {
          throw new Error(res?.error || "Error al subir imagen");
        }
      } else {
        // Guardar para subir después (offline)
        await this.saveOfflineImage(formData);
        this.toolService.toastAlert(
          "Sin conexión. La imagen se subirá cuando haya internet",
          3000,
          ["Ok"],
          "middle"
        );
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      this.toolService.toastAlert(
        `Error al subir imagen: ${error.message}`,
        0,
        ["Ok"],
        "middle"
      );
    } finally {
      loading.dismiss();
    }
  }

  // Función para guardar información de la imagen
  async saveImageInfo(imageUrl: string, fileName: string) {
    const imageData = {
      userId: this.userId,
      title: this.localTitle,
      url: imageUrl,
      fileName: fileName,
      description: this.localDescription,
      locationFolder: this.imgFolder,
      uploadedAt: new Date().toISOString(),
    };

    // Guardar en tu base de datos local/SQLite
    // Ejemplo con tu función addRecord
    // await addRecord(this.DB, "images", imageData);
  }

  // Guardar para subir offline
  async saveOfflineImage(formData: FormData) {
    const offlineQueue = await this.toolService.getSecureStorage<
      OfflineQueueItem[]
    >("offlineQueue", []);

    offlineQueue.push({
      type: "upload",
      endpoint: "api/r2/upload",
      formData: formData,
      timestamp: new Date().toISOString(),
    });

    await this.toolService.setSecureStorage("offlineQueue", offlineQueue);
  }

  // Termina nueva seccion agregar imagenes --------------------------

  async uploadData_AWS(formData: FormData) {
    const loading = await this.loadingCtrl.create({
      message: "Uploading image... ",
    });

    let params: {} = {
      userId: this.userId,
      title: this.localTitle,
      url: this.localUrl,
      description: this.localDescription,
      locationFolder: this.imgFolder,
    };

    // use your own API
    if (await this.toolService.getSecureStorage<boolean>("netStatus", false)) {
      this.api
        .postDataInfo("api/info", formData, params)
        .then(async (resp) => {});
    } else {
      this.toolService.toastAlert(
        "No hay Acceso a internet, uploadData",
        0,
        ["Ok"],
        "middle"
      );
    }
  }

  async uploadFile_AWS() {
    this.image = this.localImg.dataUrl;
    const blob = this.dataURLtoBlob(this.localImg.dataUrl);
    var imageFile = new File([blob], "profile.jpg", { type: "image/jpg" });

    let formData = new FormData();
    formData.append("image", blob, "profile.jpg");

    const loading = await this.loadingCtrl.create({
      message: "Uploading image... ",
    });

    let params: {} = {
      userId: this.userId,
      title: this.localTitle,
      url: this.localUrl,
      description: this.localDescription,
      locationFolder: this.imgFolder,
    };

    // use your own API

    let options = {
      headers: {
        "content-type": "application/json",
      },
      params: params,
    };

    if (await this.toolService.getSecureStorage<boolean>("netStatus", false)) {
      const data$ = this.http.post<any>(
        this.REST_API_SERVER + "api/info/" + this.userId,
        formData,
        options
      );
      const res = await lastValueFrom(data$);
    } else {
      this.toolService.toastAlert(
        "No hay Acceso a internet, uploadFile",
        0,
        ["Ok"],
        "middle"
      );
    }
  }

  dataURLtoBlob(dataurl: any) {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  //#endregion Image section ------------------------------------------------

  async collectInfo() {
    if (await this.toolService.getSecureStorage<boolean>("netStatus", false)) {
      this.api.getData("api/info/all/" + this.userId).subscribe({
        next: async (result: any) => {
          this.localInfo = result;
        },
        error: (err: any) => {
          console.log("Error collectInfo --> ", err);
          this.toolService.toastAlert("Error: " + err, 0, ["Ok"], "middle");
        },
      });
    } else {
      this.toolService.toastAlert(
        "No hay Acceso a internet, collectInfo",
        0,
        ["Ok"],
        "middle"
      );
    }
  }

  getEncodedUrl(imagePath: string): string {
    return encodeURIComponent(imagePath);
  }

  async doRefresh(event: any) {
    this.collectInfo();

    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  async StatusInfo(event: any, status: any, infoId: any) {
    try {
      if (event.detail.checked && status) {
        //Show
        if (
          await this.toolService.getSecureStorage<boolean>("netStatus", false)
        ) {
          await this.api
            .postData("api/info/updStatus/" + this.userId + "/" + infoId, {
              disable: false,
            })
            .then(async (result) => {
              setTimeout(async () => {
                await this.collectInfo();
              }, 2000);
            });
        } else {
          this.toolService.toastAlert(
            "No hay Acceso a internet, StatusInfo",
            0,
            ["Ok"],
            "middle"
          );
        }
      } else if (event.detail.checked && !status) {
        // Hide
        if (
          await this.toolService.getSecureStorage<boolean>("netStatus", false)
        ) {
          await this.api
            .postData("api/info/updStatus/" + this.userId + "/" + infoId, {
              disable: true,
            })
            .then(async () => {
              setTimeout(async () => {
                await this.collectInfo();
              }, 2000);
            });
        } else {
          this.toolService.toastAlert(
            "No hay Acceso a internet, api/info/updStatus/",
            0,
            ["Ok"],
            "middle"
          );
        }
      }
    } catch (e) {}
  }

  async cancelUploadFile() {
    this.imageFileName = "";
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
