import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon,
  IonButtons,
 } 
from '@ionic/angular/standalone';
import { addIcons } from "ionicons";
import { Router } from '@angular/router';
import { arrowBackCircleOutline} from "ionicons/icons";

@Component({
  selector: 'app-store',
  templateUrl: './store.page.html',
  styleUrls: ['./store.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar,
     CommonModule, FormsModule,IonIcon, IonButtons]
})
export class StorePage implements OnInit {

  constructor(
    private router: Router,
  ) { 
    addIcons({
      arrowBackCircleOutline
    });
  }

  ngOnInit() {
  }

  moveToLogin(){
    this.router.navigateByUrl("/login", { replaceUrl: true });
  }

}
