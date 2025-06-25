import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdCodesModalPage } from './upd-codes-modal.page';

describe('UpdCodesModalPage', () => {
  let component: UpdCodesModalPage;
  let fixture: ComponentFixture<UpdCodesModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdCodesModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
