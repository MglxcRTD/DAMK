import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Asignatura } from './asignatura';

describe('Asignatura', () => {
  let component: Asignatura;
  let fixture: ComponentFixture<Asignatura>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Asignatura]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Asignatura);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
