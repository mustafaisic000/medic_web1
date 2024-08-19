export interface Role {
  id: number;
  name: string;
}

export interface Root {
  id: number;
  username: string;
  password: string;
  name: string;
  imageUrl?: string;
  dateOfBirth: string;
  isBlocked: boolean;
  lastLoginDate: string;
  roleId: number;
  role?: Role; 
  orders:number;
}
