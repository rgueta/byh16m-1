import { Component, OnInit, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AlertController } from "@ionic/angular";
import { DatabaseService } from "../../services/database.service";
import { Subscription } from "rxjs";

import { FormsModule, FormGroup } from "@angular/forms";
import {
  ModalController,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonIcon,
  IonLabel,
  IonList,
  IonRefresherContent,
  IonRefresher,
  IonButtons,
  IonButton,
  IonSearchbar,
  IonSelect,
} from "@ionic/angular/standalone";

import { addIcons } from "ionicons";
import {
  arrowBackCircleOutline,
  chevronForwardOutline,
  chevronDownOutline,
  arrowBackOutline,
} from "ionicons/icons";

@Component({
  selector: "app-upd-cpus",
  templateUrl: "./upd-cpus.page.html",
  styleUrls: ["./upd-cpus.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonInput,
    IonItem,
    IonLabel,
    IonIcon,
    IonList,
    IonRefresherContent,
    IonRefresher,
    IonButtons,
    IonButton,
    IonSelect,
  ],
})
export class UpdCpusPage implements OnInit {
  @Input() cores?: number = 23;
  public userId: any;
  public CpuList: any;
  automaticClose = false;
  routineOpen = false;
  isReadOnly: boolean = true;
  myToast: any;
  cpus = {
    _id: "",
    cores: 0,
    entry: 0,
    coord: ["", ""],
    houses: 0,
    sim: "",
    school: false,
  };

  constructor(
    public modalController: ModalController,
    public api: DatabaseService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      arrowBackCircleOutline,
      chevronForwardOutline,
      chevronDownOutline,
      arrowBackOutline,
    });
  }

  ngOnInit() {
    this.getCpus();
  }

  async doRefresh(event: any) {
    this.isReadOnly = true;
    this.getCpus();

    setTimeout(() => {
      event.target.complete();
    }, 2000);
  }

  toggleSection(index: number) {
    this.CpuList[index].open = !this.CpuList[index].open;
    if (this.automaticClose && this.CpuList[index].open) {
      this.CpuList.filter(
        (item: {}, itemIndex: number) => itemIndex != index
      ).map((item: any) => (item.open = false));
    }
  }

  async getCpus() {
    this.userId = localStorage.getItem("my-userId");
    let location = localStorage.getItem("location")!.split(".");

    this.api
      .getData(
        "api/cpus/full/" +
          `${location[0]},${location[1]},${location[2]},${location[3]}/`
      )
      .subscribe({
        next: async (result: any) => {
          this.CpuList = await result;
          this.CpuList[0].open = true;
        },
        error: (error) => {
          console.log("Error response --> ", error);
        },
      });
  }

  async updCpu(obj: any, value: boolean, index: number, item: any) {
    this.isReadOnly = value;
    if (obj.target.innerHTML === "Save") {
      console.log("Save to mongo ! --> ", item);
      const MsgAlert = await this.alertCtrl.create({
        header: "Confirmacion",
        message: "Save changes ?",
        buttons: [
          {
            text: "OK",
            handler: async () => {
              this.cpus._id = this.CpuList[index]["_id"];
              this.cpus.cores = this.CpuList[index]["cores"];
              this.cpus.entry = this.CpuList[index]["entry"];
              this.cpus.coord = this.CpuList[index]["coord"];
              this.cpus.houses = this.CpuList[index]["houses"];
              this.cpus.sim = this.CpuList[index]["sim"];
              this.cpus.school = this.CpuList[index]["school"];
              try {
                await this.api.putData(
                  "api/cpus/updCpu/" + localStorage.getItem("my-userId"),
                  this.cpus
                );
                this.isReadOnly = true;
              } catch (ex) {
                console.error("Error api putData --> " + ex);
              }
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            cssClass: "secondary",
            handler: () => {
              console.log("Return to --> ", this.cpus);
            },
          },
        ],
      });

      await MsgAlert.present();
    } else {
      // create item backup
      this.cpus._id = item._id;
      this.cpus.cores = item.cores;
      this.cpus.entry = item.entry;
      this.cpus.coord = item.coord;
      this.cpus.houses = item.houses;
      this.cpus.sim = item.sim;
      this.cpus.school = item.school;

      console.log("cpus copied --> ", this.cpus);
      this.isReadOnly = false;
    }
  }

  CancelUpd(index: number) {
    this.isReadOnly = true;
    this.CpuList[index]._id = this.cpus._id;
    this.CpuList[index].cores = this.cpus.cores;
    this.CpuList[index].entry = this.cpus.entry;
    this.CpuList[index].coord = this.cpus.coord;
    this.CpuList[index].houses = this.cpus.houses;
    this.CpuList[index].sim = this.cpus.sim;
    this.CpuList[index].school = this.cpus.school;
  }

  closeModal() {
    this.modalController.dismiss();
  }
}
