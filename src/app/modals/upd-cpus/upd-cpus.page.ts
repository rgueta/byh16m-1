import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-upd-cpus',
  templateUrl: './upd-cpus.page.html',
  styleUrls: ['./upd-cpus.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class UpdCpusPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
