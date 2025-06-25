import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-upd-codes-modal',
  templateUrl: './upd-codes-modal.page.html',
  styleUrls: ['./upd-codes-modal.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class UpdCodesModalPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
