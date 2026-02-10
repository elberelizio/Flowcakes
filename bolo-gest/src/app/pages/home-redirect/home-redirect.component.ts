import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: '<p class="redirect-msg">A redirecionar...</p>',
  styles: ['.redirect-msg { padding: 1rem; text-align: center; }'],
})
export class HomeRedirectComponent implements OnInit {
  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.router.navigateByUrl(this.auth.isAdmin() ? '/admin' : '/dashboard');
  }
}
