import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MojConfig } from '../../moj-config';
import { Root } from "./user-getall-response";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  searchQuery: string = '';
  totalUsers: number = 0;
  private apiUrl = 'https://localhost:7255/User/register';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.http.get<any[]>(MojConfig.addres_server + 'User/users')
      .subscribe(users => {
        this.users = users;
        this.filteredUsers = users;
        this.totalUsers = users.length;
      });
  }

  searchUsers() {
    if (this.searchQuery) {
      this.filteredUsers = this.users.filter(user => user.username.toLowerCase().includes(this.searchQuery.toLowerCase()));
    } else {
      this.filteredUsers = this.users;
    }
  }

  filterUsersByRole(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const roleId = selectElement.value;

    if (roleId === 'all') {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user => user.roleId === parseInt(roleId));
    }
  }

  showUserDetails(user: Root) {
    Swal.fire({
      title: 'User Details',
      html: `
      <p>ID: ${user.id}</p>
      <p>Name: ${user.name}</p>
      <p>Username: ${user.username}</p>
      <p>Last Login Date: ${user.lastLoginDate}</p>
      <p>Status: ${user.isBlocked ? 'Blocked' : 'Active'}</p>
      <p>Date of Birth: ${user.dateOfBirth}</p>
    `,
      showCancelButton: true,
      confirmButtonText: 'Edit',
      cancelButtonText: 'Close'
    }).then(result => {
      if (result.isConfirmed) {
        this.editUser(user);
      }
    });
  }

  editUser(user: Root) {
    Swal.fire({
      title: 'Edit User',
      html: `
      <input type="text" id="username" class="swal2-input" placeholder="Username" value="${user.username}">
      <input type="password" id="password" class="swal2-input" placeholder="Password (leave blank if not changing)">
      <input type="text" id="name" class="swal2-input" placeholder="Name" value="${user.name}">
      <input type="date" id="dateOfBirth" class="swal2-input" placeholder="Date of Birth" value="${user.dateOfBirth.split('T')[0]}"> <!-- Format date correctly -->
      <input type="url" id="imageUrl" class="swal2-input" placeholder="Image URL" value="${user.imageUrl || ''}">
      <input type="number" id="orders" class="swal2-input" placeholder="Orders" min="1" max="10" value="${user.orders}">
      <input type="checkbox" id="isBlocked" ${user.isBlocked ? 'checked' : ''}> Is Blocked
    `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      denyButtonText: 'Block',
      preConfirm: () => {
        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const name = (document.getElementById('name') as HTMLInputElement).value;
        const dateOfBirth = (document.getElementById('dateOfBirth') as HTMLInputElement).value;
        const imageUrl = (document.getElementById('imageUrl') as HTMLInputElement).value;
        const orders = parseInt((document.getElementById('orders') as HTMLInputElement).value, 10);
        const isBlocked = (document.getElementById('isBlocked') as HTMLInputElement).checked;

        if (!username || !name || !dateOfBirth || isNaN(orders) || orders < 1 || orders > 10) {
          Swal.showValidationMessage('Please fill in all required fields and ensure orders is between 1 and 10.');
          return;
        }

        return {
          id: user.id,
          username,
          password: password || user.password,
          name,
          dateOfBirth: new Date(dateOfBirth).toISOString(),
          imageUrl: imageUrl || null,
          roleId: user.roleId,
          role: {
            id: user.role?.id || 0,
            name: user.role?.name || 'Default Role'
          },
          orders,
          isBlocked,
          lastLoginDate: user.lastLoginDate // Use existing if not changing
        };
      }
    }).then(result => {
      if (result.isConfirmed) {
        const updatedUser = result.value;
        console.log('Sending request to API with payload:', updatedUser);

        this.http.put(`${MojConfig.addres_server}User/users/${updatedUser.id}`, updatedUser, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          }),
          observe: 'response' // To access response status code
        }).subscribe({
          next: (response) => {
            if (response.status === 204) {
              this.fetchUsers();
              Swal.fire('Success', 'User updated successfully!', 'success');
            } else {
              Swal.fire('Warning', 'Unexpected response from server.', 'warning');
            }
          },
          error: (err) => {
            console.error('Update user error:', err);
            Swal.fire('Error', `Failed to update user. ${err.error.message || 'Please try again.'}`, 'error');
          }
        });
      } else if (result.isDenied) {
        this.blockUser(user);
      }
    });
  }


  blockUser(user: Root) {
    Swal.fire({
      title: 'Confirm Block',
      text: "Are you sure you want to block this user?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, block it!',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.http.put(`${MojConfig.addres_server}User/users/block/${user.id}`, {}, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          }),
          observe: 'response'
        }).subscribe({
          next: () => {
            this.fetchUsers();
            Swal.fire('Blocked!', 'User has been blocked.', 'success');
          },
          error: (err) => {
            console.error('Block user error:', err);
            Swal.fire('Error', 'Failed to block user', 'error');
          }
        });
      }
    });
  }


  logout() {
    const token = localStorage.getItem('token');
    if (token) {
      this.http.post(MojConfig.addres_server + 'Auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe(() => {
        localStorage.removeItem('token');
        this.router.navigate(['/']);
      });
    }
  }

  registerUser() {
    Swal.fire({
      title: 'Register User',
      html: `
      <input type="text" id="username" class="swal2-input" placeholder="Username" required autocomplete="username">
      <input type="password" id="password" class="swal2-input" placeholder="Password" required autocomplete="new-password">
      <input type="text" id="name" class="swal2-input" placeholder="Name" required>
      <input type="date" id="dateOfBirth" class="swal2-input" placeholder="Date of Birth" required>
      <input type="text" id="imageUrl" class="swal2-input" placeholder="Image URL">
      <input type="number" id="orders" class="swal2-input" placeholder="Orders (1-10)" min="1" max="10" required>
    `,
      showCancelButton: true,
      confirmButtonText: 'Register',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const name = (document.getElementById('name') as HTMLInputElement).value;
        const dateOfBirth = (document.getElementById('dateOfBirth') as HTMLInputElement).value;
        const imageUrl = (document.getElementById('imageUrl') as HTMLInputElement).value;
        const orders = parseInt((document.getElementById('orders') as HTMLInputElement).value, 10);

        console.log('Pre-confirm values:', {
          username,
          password,
          name,
          dateOfBirth,
          imageUrl,
          orders
        });

        // Validate inputs
        if (!username || !password || !name || !dateOfBirth || isNaN(orders) || orders < 1 || orders > 10) {
          Swal.showValidationMessage('Please fill in all required fields correctly.');
          return;
        }

        // Return payload for submission
        const payload = {
          id: 0,
          username,
          password,
          name,
          dateOfBirth: new Date(dateOfBirth).toISOString(),
          imageUrl: imageUrl || '',
          roleId: 2,
          role: {
            id: 2,
            name: 'Admin'
          },
          isBlocked: false,
          lastLoginDate: new Date().toISOString(),
          orders
        };

        console.log('Payload to send:', payload);
        return payload;
      }
    }).then(result => {
      if (result.isConfirmed) {
        const newUser = result.value;
        console.log('Registering user with payload:', newUser);

        this.http.post(`${MojConfig.addres_server}User/register`, newUser, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json'
          }),
          observe: 'response'
        }).subscribe({
          next: (response) => {
            console.log('Server response:', response);
            if (response.status === 200) { // Ensure the status code is checked correctly
              this.fetchUsers(); // Update user list
              Swal.fire('Success', 'User registered successfully!', 'success');
            } else {
              Swal.fire('Warning', `Unexpected response from server: ${response.statusText}`, 'warning');
            }
          },
          error: (err) => {
            console.error('Register user error:', err);
            Swal.fire('Error', `Failed to register user: ${err.message || 'Please try again.'}`, 'error');
          }
        });
      }
    });
  }


}
