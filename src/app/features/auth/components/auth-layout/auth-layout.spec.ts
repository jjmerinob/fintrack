import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthLayout } from './auth-layout';

describe('AuthLayout', () => {
  let fixture: ComponentFixture<AuthLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AuthLayout] }).compileComponents();

    fixture = TestBed.createComponent(AuthLayout);
    fixture.componentRef.setInput('heading', 'Welcome back');
    fixture.componentRef.setInput('subheading', 'Sign in to continue');
    await fixture.whenStable();
  });

  it('should render the heading as the page level-one title', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Welcome back');
  });

  it('should render the subheading', () => {
    expect(fixture.nativeElement.textContent).toContain('Sign in to continue');
  });

  it('should hide the decorative brand panel from assistive technology on small screens', () => {
    // The panel is purely decorative, so its icon must not be announced.
    const icon = fixture.nativeElement.querySelector('aside svg');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});
