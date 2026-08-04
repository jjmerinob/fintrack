import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Sidenav } from './sidenav';

describe('Sidenav', () => {
  let fixture: ComponentFixture<Sidenav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidenav],
      // A real, matchable route: clicking a routerLink triggers an actual
      // navigation the router must be able to resolve.
      providers: [provideRouter([{ path: 'dashboard', children: [] }])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidenav);
    await fixture.whenStable();
  });

  it('should link to every top-level feature', () => {
    const hrefs = [...fixture.nativeElement.querySelectorAll('a')].map((a: HTMLAnchorElement) =>
      a.getAttribute('href'),
    );

    expect(hrefs).toEqual(['/dashboard', '/transactions', '/ai-insights', '/profile']);
  });

  it('should emit when a link is clicked, so the shell can close the mobile overlay', () => {
    const emitted = vi.fn();
    fixture.componentInstance.linkClicked.subscribe(emitted);

    fixture.nativeElement.querySelector('a').click();

    expect(emitted).toHaveBeenCalledTimes(1);
  });
});
