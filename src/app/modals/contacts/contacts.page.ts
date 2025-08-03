import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  ModalController,
  AlertController,
  LoadingController,
  IonText,
  IonLabel,
  IonImg,
  IonAvatar,
  IonIcon,
  IonItem,
  IonList,
  IonButtons,
} from "@ionic/angular/standalone";
import { Contacts, GetContactsResult } from "@capacitor-community/contacts";
import { ToolsService } from "../../services/tools.service";
import { addIcons } from "ionicons";
import {
  peopleCircleOutline,
  arrowBackCircleOutline,
  personCircleOutline,
} from "ionicons/icons";
import { NgFor, NgIf } from "@angular/common";

@Component({
  selector: "app-contacts",
  templateUrl: "./contacts.page.html",
  styleUrls: ["./contacts.page.scss"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonAvatar,
    CommonModule,
    FormsModule,
    IonText,
    IonLabel,
    IonImg,
    IonIcon,
    IonItem,
    IonList,
    IonButtons,
    NgFor,
    NgIf,
    ReactiveFormsModule,
  ],
})
export class ContactsPage implements OnInit {
  myToast: any;
  // public contacts: Observable<[Contact]>;
  // contacts: Observable<Contact[]>;
  // contacts: Observable<Contact[]>;
  // public contacts? : GetContactsResult;
  public contacts: any = [];
  // Contacts : {}
  contact = {};
  constructor(
    private modalController: ModalController,
    private loadingController: LoadingController,
    public alertCtrl: AlertController,
    private toolService: ToolsService
  ) {
    addIcons({
      peopleCircleOutline,
      arrowBackCircleOutline,
      personCircleOutline,
    });
  }

  async ngOnInit() {
    this.basicLoader();
    await this.loadContacts();
  }

  async loadContacts() {
    this.toolService.getSecureStorage("lista").subscribe({
      next: (result) => {
        this.contacts = JSON.parse(result);
      },
      error: (err) => {
        this.toolService.toastAlert(
          "error, obteniendo contact lista en getSecureStorage: " + err,
          0,
          ["Ok"],
          "middle"
        );
      },
    });

    try {
      await Contacts.getContacts({
        projection: {
          // Specify which fields should be retrieved.
          name: true,
          phones: true,
          postalAddresses: true,
          emails: true,
          image: true,
        },
      }).then(async (result) => {
        let localcontacts = result.contacts;
        let allName: any = [];
        localcontacts.forEach(async (item: any) => {
          if (item.name) await allName.push(item);
        });

        this.contacts = await this.toolService.sortJSON(
          allName,
          "display",
          true
        );
        // await localStorage.setItem('lista',await JSON.stringify(this.contacts));
      });
    } catch (e) {
      this.toolService.toastAlert(
        "Get contacts, error:<br>" + e,
        0,
        ["Ok"],
        "middle"
      );
    }
  }

  basicLoader() {
    this.loadingController
      .create({
        message: "Please wait...",
        duration: 3000,
        translucent: true,
      })
      .then((res) => {
        res.present();
      });
  }

  async onClickContact(Contact: {}) {
    this.contact = Contact;

    // >> Confirmation ------------------------------------

    let alert = await this.alertCtrl.create({
      subHeader: "Confirmar",
      message: "Aceptar contacto ?",
      cssClass: "basic-alert",
      buttons: [
        {
          text: "No",
          role: "cancel",
          cssClass: "icon-color",
          handler: () => {},
        },
        {
          text: "Si",
          cssClass: "icon-color",
          handler: async () => {
            this.closeModal();
          },
        },
      ],
    });

    await alert.present();

    // << Confirmation  -----------------------------------
  }

  closeModal() {
    this.modalController.dismiss(this.contact);
  }
}
