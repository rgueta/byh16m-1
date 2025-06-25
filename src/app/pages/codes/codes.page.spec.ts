import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodesPage } from './codes.page';

describe('CodesPage', () => {
  let component: CodesPage;
  let fixture: ComponentFixture<CodesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CodesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
