import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Router, RouterModule } from '@angular/router';
import { MojConfig } from '../../moj-config';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, HttpClientModule, RouterModule]
})
export class LoginComponent {
  constructor(private http: HttpClient, private router: Router) {}

  onSubmit(loginForm: NgForm) {
    if (loginForm.valid) {
      Swal.showLoading(); // Show loading indicator
      this.http.post<any>(MojConfig.addres_server + 'Auth/login', loginForm.value)
        .subscribe(
          response => {
            Swal.close(); // Close the loading indicator
            localStorage.setItem('token', response.token);

            // Show success message
            Swal.fire({
              icon: 'success',
              title: 'Login successful',
              text: 'You have successfully logged in!',
              timer: 2000, // Optional: Auto-close after 2 seconds
              showConfirmButton: false
            }).then(() => {
              this.router.navigate(['/home']);
            });
          },
          error => {
            Swal.close();
            Swal.fire({
              icon: 'error',
              title: 'Login failed',
              text: 'Invalid username or password'
            });
          }
        );
    }
  }
}
