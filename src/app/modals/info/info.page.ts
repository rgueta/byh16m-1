import { Component, OnInit, Input, NgModule } from "@angular/core";
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
  RegisterForm!: FormGroup;
  imageURI: any;
  imageFileName: any;
  myToast: any;
  userId: string = "";
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
  public imgFolder: String = "";
  public localInfo: any;

  localImg: any;
  image: any;

  ImageSize: any;
  public pinFormatter: any;

  REST_API_SERVER = environment.cloud.server_url;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    public loadingCtrl: LoadingController,
    private api: DatabaseService,
    private http: HttpClient,
    private toolService: ToolsService
  ) {
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
    this.localTitle = "Aqui va el titulo..";
    this.userId = localStorage.getItem("my-userId")!;
    this.collectCountries();
    this.collectInfo();
  }

  //#region select location  -------------------------------------------
  async collectCountries() {
    this.api.getData("api/countries/" + this.userId).subscribe({
      next: async (result) => {
        this.countriesList = result;
      },
      error: (error) => {
        this.toolService.toastAlert("Error: " + error, 0, ["Ok"], "middle");
      },
    });
  }

  async collectStates(country: any) {
    this.api
      .getData("api/states/" + country + "/" + this.userId)
      .subscribe(async (statesResult) => {
        this.statesList = statesResult;
      });
  }

  async collectCities(state: any) {
    this.api
      .getData(
        "api/cities/" + this.localCountry + "/" + state + "/" + this.userId
      )
      .subscribe(async (citiesResult) => {
        this.citiesList = citiesResult;
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
      .subscribe(async (divisionsResult) => {
        this.divisionsList = divisionsResult;
      });
  }

  async collectCpus(division: any) {
    this.api
      .getData(
        "api/cpus/basic/" +
          this.localCountry +
          "/" +
          this.localState +
          "/" +
          this.localCity +
          "/" +
          parseInt(division) +
          "/" +
          this.userId
      )
      .subscribe(async (cpusResult) => {
        this.cpusList = cpusResult;
      });
  }
  async collectCores(cpu: any) {
    this.api
      .getData(
        "api/cores/light/" +
          this.localCountry +
          "/" +
          this.localState +
          "/" +
          this.localCity +
          "/" +
          this.localDivision +
          "/" +
          cpu +
          "/" +
          this.userId
      )
      .subscribe(async (coresResult) => {
        this.coresList = coresResult;
      });
  }

  async countrySelection(country: any) {
    let countryObj = this.RegisterForm.controls["frmCtrl_country"].value;
    if (country) {
      this.collectStates(country);
      this.localCountry = country;
    } else {
      console.log("no contry selected");
    }

    // this.localCountry = countryObj.name;
  }

  async stateSelection(state: any) {
    this.collectCities(state);
    this.localState = state;
  }

  async citySelection(city: any) {
    this.collectDivisions(city[0]);
    this.localCity = city[0];
  }

  async divisionSelection(division: any) {
    await this.collectCpus(division[0]);
    this.localDivision = await division[0];
  }

  async cpuSelection(cpu: any) {
    await this.collectCores(cpu);
    this.localCpu = await cpu;
  }

  async coreSelection(core: any) {
    this.localCore = core;
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
    this.ImageSize = await event.detail.value;
  }

  //#region Image section ------------------------------------------------

  async getImage() {
    try {
      this.localImg = await Camera.getPhoto({
        quality: this.ImageSize,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (this.localImg) {
        this.imageFileName = Capacitor.convertFileSrc(this.localImg.dataUrl);
        this.localDescription = "Description";
        this.localUrl = "Local Url";
      }
    } catch (e) {
      console.log("Error getImage: ", e);
    }
  }

  async uploadFile() {
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

    if (await this.toolService.verifyNetStatus()) {
      const data$ = this.http.post<any>(
        this.REST_API_SERVER + "api/info/" + this.userId,
        formData,
        options
      );
      const res = await lastValueFrom(data$);
    } else {
      this.toolService.toastAlert(
        "No hay Acceso a internet",
        0,
        ["Ok"],
        "middle"
      );
    }
  }

  async uploadData(formData: FormData) {
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
    if (await this.toolService.verifyNetStatus()) {
      this.api
        .postDataInfo("api/info", formData, params)
        .then(async (resp) => {});
    } else {
      this.toolService.toastAlert(
        "No hay Acceso a internet",
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
    if (await this.toolService.verifyNetStatus()) {
      this.api.getData("api/info/all/" + this.userId).subscribe({
        next: async (result) => {
          console.log("info --> ", result);
          this.localInfo = result;
        },
        error: (err) => {
          console.log("Error collectInfo --> ", err);
          this.toolService.toastAlert("Error: " + err, 0, ["Ok"], "middle");
        },
      });
    } else {
      this.toolService.toastAlert(
        "No hay Acceso a internet",
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

  async StatusInfo(event: any, status: any, infoId: any) {
    try {
      if (event.detail.checked && status) {
        //Show
        if (await this.toolService.verifyNetStatus()) {
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
            "No hay Acceso a internet",
            0,
            ["Ok"],
            "middle"
          );
        }
      } else if (event.detail.checked && !status) {
        // Hide
        if (await this.toolService.verifyNetStatus()) {
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
            "No hay Acceso a internet",
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
