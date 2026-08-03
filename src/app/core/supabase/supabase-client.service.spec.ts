import { TestBed } from '@angular/core/testing';

import { SupabaseClientService } from './supabase-client.service';

describe('SupabaseClientService', () => {
  let service: SupabaseClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupabaseClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
