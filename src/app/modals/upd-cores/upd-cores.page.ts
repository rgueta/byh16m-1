import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-upd-cores',
  templateUrl: './upd-cores.page.html',
  styleUrls: ['./upd-cores.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class UpdCoresPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
