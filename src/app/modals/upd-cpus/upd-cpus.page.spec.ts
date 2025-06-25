import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdCpusPage } from './upd-cpus.page';

describe('UpdCpusPage', () => {
  let component: UpdCpusPage;
  let fixture: ComponentFixture<UpdCpusPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdCpusPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
