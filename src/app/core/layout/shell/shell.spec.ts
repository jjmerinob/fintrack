import { BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme/theme.service';
import { UserService } from '../../user/user.service';
import { Sidenav } from '../sidenav/sidenav';
import { Shell } from './shell';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  function sidenav(): MatSidenav {
    return fixture.debugElement.query(By.directive(MatSidenav)).componentInstance;
  }

  /**
   * Lets the drawer's async `openedChange` emit land before moving on.
   *
   * This suite used to need a 250ms wait here as well, to get past the
   * `setTimeout(…, 200)` that MatSidenavContainer uses to enable its CSS
   * transitions: before that landed, a stale "opened" emit could arrive after a
   * close and reopen the drawer, so the result depended on how fast the test
   * ran. `Shell.onOpenedChange` now ignores "opened" events outright, so both
   * timing regimes behave the same and the wait is gone.
   */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: vi.fn() } },
        { provide: ThemeService, useValue: { isDark: () => false, toggle: vi.fn() } },
        { provide: UserService, useValue: { displayName: () => 'Ada Lovelace' } },
        // Mocked instead of relying on the real (root-scoped, shared across every
        // test file) BreakpointObserver singleton: other spec files that render
        // Material overlays can leave its cached MediaQueryList state affecting
        // unrelated tests, which made this suite order-dependent.
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: false, breakpoints: {} }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
  });

  it('should render the header, the navigation and a router outlet for the page content', () => {
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('app-header')).toBeTruthy();
    expect(el.querySelector('app-sidenav')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });

  it('should keep the sidenav closed by default on a narrow (mobile) viewport', () => {
    expect(sidenav().mode).toBe('over');
    expect(sidenav().opened).toBe(false);
  });

  it('should open the sidenav when the header requests it', async () => {
    fixture.nativeElement.querySelector('button[aria-label="Open navigation menu"]').click();
    await settle();

    expect(sidenav().opened).toBe(true);
  });

  it('should close the sidenav when Sidenav reports a navigation, on a narrow viewport', async () => {
    fixture.nativeElement.querySelector('button[aria-label="Open navigation menu"]').click();
    await settle();
    expect(sidenav().opened).toBe(true);

    // Emitting the output directly (rather than clicking a routerLink) keeps
    // this test independent of real navigation and of MatSidenav's CSS-driven
    // open/close animation, which jsdom cannot run.
    fixture.debugElement.query(By.directive(Sidenav)).componentInstance.linkClicked.emit();
    await settle();

    expect(sidenav().opened).toBe(false);
  });

  it('should follow the drawer when it closes itself, e.g. via the backdrop or Esc', async () => {
    fixture.nativeElement.querySelector('button[aria-label="Open navigation menu"]').click();
    await settle();

    sidenav().close();
    await settle();

    // If the shell's own signal had not followed, the next change detection
    // would push `[opened]="true"` back down and reopen the drawer.
    expect(sidenav().opened).toBe(false);
  });

  it('should ignore a stale "opened" event that lands after the drawer was closed', async () => {
    fixture.nativeElement.querySelector('button[aria-label="Open navigation menu"]').click();
    await settle();

    fixture.debugElement.query(By.directive(Sidenav)).componentInstance.linkClicked.emit();
    await settle();
    expect(sidenav().opened).toBe(false);

    // `openedChange` is an async emitter fired at the end of an animation, so an
    // event from the earlier open can still be in flight when the user closes
    // the drawer. Writing it back would resurrect a panel already dismissed.
    sidenav().openedChange.emit(true);
    await settle();

    expect(sidenav().opened).toBe(false);
  });
});
