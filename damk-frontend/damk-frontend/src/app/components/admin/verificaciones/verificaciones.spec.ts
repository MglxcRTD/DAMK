import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Verificaciones } from './verificaciones';

describe('Verificaciones', () => {
  let component: Verificaciones;
  let fixture: ComponentFixture<Verificaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Verificaciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Verificaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
