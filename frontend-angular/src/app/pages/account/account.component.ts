import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service';

const fields = [
  { name: 'firstName', label: 'First name', type: 'text' },
  { name: 'lastName', label: 'Last name', type: 'text' },
  { name: 'phone', label: 'Phone number', type: 'tel' },
  { name: 'email', label: 'Email', type: 'email', disabled: true },
  { name: 'address', label: 'Primary address', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'pinCode', label: 'Pin code', type: 'text' }
] as const;

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html'
})
export class AccountComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  form: UserProfile = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    state: '',
    city: '',
    pinCode: '',
    permanentAddress: '',
    currentAddress: ''
  };

  status: string | null = null;
  readonly fields = fields;

  ngOnInit(): void {
    if (!this.auth.user) {
      this.router.navigate(['/login']);
      return;
    }
    const user = this.auth.user;
    this.form = {
      ...this.form,
      firstName: user.firstName || user.firstname || '',
      lastName: user.lastName || user.lastname || '',
      phone: user.phone || '',
      email: user.email || '',
      address: user.address || '',
      state: user.state || '',
      city: user.city || '',
      pinCode: user.pinCode || user.pincode || '',
      permanentAddress: user.permanentAddress || '',
      currentAddress: user.currentAddress || ''
    };
  }

  get displayName(): string {
    const base = this.auth.user?.name || this.auth.user?.email || 'Your account';
    const compiled = [this.form.firstName, this.form.lastName].filter(Boolean).join(' ').trim();
    return compiled || base;
  }

  save(): void {
    this.auth.updateProfile(this.form);
    this.status = 'Contact details saved successfully.';
    setTimeout(() => (this.status = null), 4000);
  }
}
