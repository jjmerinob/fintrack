import { Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../theme/theme.service';
import { UserService } from '../../user/user.service';

@Component({
  selector: 'app-header',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatToolbarModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly theme = inject(ThemeService);
  protected readonly user = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Lets the shell open the overlay sidenav on mobile. */
  readonly menuButtonClicked = output<void>();

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
