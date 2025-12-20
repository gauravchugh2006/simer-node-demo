import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService, AuthPayload } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form = { email: '', password: '' };
  error: string | null = null;
  loading = false;

  async submit(): Promise<void> {
    this.error = null;
    this.loading = true;
    try {
      const payload = await firstValueFrom(
        this.api.post<AuthPayload>('/api/auth/login', this.form)
      );
      this.auth.login(payload);
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error('Login failed', err);
      this.error = err?.error?.message || 'Unable to login.';
    } finally {
      this.loading = false;
    }
  }
}
