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
   * MatSidenavContainer enables its CSS transitions from a `setTimeout(…, 200)`
   * fired on init. Until that lands, a toggle takes an immediate code path that
   * emits `openedChange` from a timer — and since the template writes that back
   * into `sidenavOpened`, an in-flight "opened" emit could land *after* a close
   * and reopen the drawer. Whether that happened depended purely on how fast the
   * test ran, which is what made this suite fail intermittently (~40% of runs,
   * even in isolation).
   *
   * Waiting past the timer pins every test to the same regime the real app runs
   * in: transitions on, where `opened` is set synchronously and `openedChange`
   * waits for a `transitionend` that jsdom never fires.
   */
  const TRANSITIONS_ENABLED_DELAY = 250;

  /** Lets the drawer settle before the next interaction, as a real user would. */
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
    await new Promise((resolve) => setTimeout(resolve, TRANSITIONS_ENABLED_DELAY));
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
});
