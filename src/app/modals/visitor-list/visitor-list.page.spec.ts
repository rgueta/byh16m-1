import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorListPage } from './visitor-list.page';

describe('VisitorListPage', () => {
  let component: VisitorListPage;
  let fixture: ComponentFixture<VisitorListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitorListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
