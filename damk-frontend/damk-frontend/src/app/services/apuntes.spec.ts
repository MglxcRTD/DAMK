import { TestBed } from '@angular/core/testing';

import { Apuntes } from './apuntes';

describe('Apuntes', () => {
  let service: Apuntes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Apuntes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
