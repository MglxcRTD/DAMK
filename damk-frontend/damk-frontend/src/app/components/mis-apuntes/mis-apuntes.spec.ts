import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisApuntes } from './mis-apuntes';

describe('MisApuntes', () => {
  let component: MisApuntes;
  let fixture: ComponentFixture<MisApuntes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MisApuntes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisApuntes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
