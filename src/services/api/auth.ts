import { userManagementApiClient, coreApiClient } from './client';
import { tokenStorage } from '@/utils/token-storage';

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface VerifyResetTokenData {
  token: string;
}

export interface SetNewPasswordData {
  token: string;
  password: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image?: string;
}

export type ApiError = {
  error: string;
  statusCode?: number;
};

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface CreateUserData {
  company_id: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: string;
  profile_image?: string;
}

export interface UserResponse {
  id: string;
  company_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

// Auth API
export const authApi = {
  // Login with email and password
  login: async (email: string, password: string): Promise<{ message: string }> => {
    const response = await userManagementApiClient.post<{ message: string }>('/auth/login/', {
      email,
      password
    });
    return response.data;
  },
  
  // Verify OTP after login
  verifyOtp: async (email: string, otp: string): Promise<{ access: string; refresh: string; role: string }> => {
    const response = await userManagementApiClient.post<{ access: string; refresh: string; role: string }>('/auth/verify-otp/', {
      email,
      otp
    });
    return response.data;
  },
  
  // Resend OTP
  resendOtp: async (email: string): Promise<{ message: string }> => {
    const response = await userManagementApiClient.post<{ message: string }>('/auth/resend-otp/', {
      email
    });
    return response.data;
  },
  
  // Verify token validity
  verifyToken: async (token: string): Promise<boolean> => {
    try {
      await userManagementApiClient.post('/auth/verify-token/', { token });
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // Register a new user
  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await userManagementApiClient.post<{ message: string }>('/auth/register/', data);
    return response.data;
  },
  
  // Create a user for a company
  createUser: async (userData: CreateUserData): Promise<UserResponse> => {
    const response = await userManagementApiClient.post<UserResponse>('/users/', userData);
    return response.data;
  },
  
  // Logout user
  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken();
    
    if (refreshToken) {
      try {
        await userManagementApiClient.post('/auth/logout/', {
          refresh: refreshToken
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear tokens regardless of API call success
    tokenStorage.clearTokens();
  },
  
  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ access: string; refresh: string }> => {
    const response = await userManagementApiClient.post<{ access: string; refresh: string }>('/auth/refresh-token/', {
      refresh_token: refreshToken
    });
    return response.data;
  },
  
  // Request password reset
  requestPasswordReset: async (data: ResetPasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await userManagementApiClient.post<{ success: boolean; message: string }>('/auth/request-reset-password/', data);
    return response.data;
  },
  
  // Verify reset token
  verifyResetToken: async (data: VerifyResetTokenData): Promise<{ success: boolean; message: string }> => {
    const response = await userManagementApiClient.post<{ success: boolean; message: string }>('/auth/verify-reset-token/', data);
    return response.data;
  },
  
  // Set new password
  setNewPassword: async (data: SetNewPasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await userManagementApiClient.post<{ success: boolean; message: string }>('/auth/set-new-password/', data);
    return response.data;
  },
  
  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ success: boolean; message: string }> => {
    const response = await userManagementApiClient.post<{ success: boolean; message: string }>('/auth/change-password/', data);
    return response.data;
  },
  
  // Get current user profile
  getProfile: async (): Promise<any> => {
    // First get the user's info from the token
    const userInfoFromToken = tokenStorage.getUserInfo();
    if (!userInfoFromToken || !userInfoFromToken.id) {
      throw new Error('No user ID available in token');
    }
    
    // Then fetch the full user details using the correct endpoint
    const response = await userManagementApiClient.get(`/users/${userInfoFromToken.id}/`);
    return response.data;
  },
  
  // Update user profile
  updateProfile: async (data: ProfileUpdateData): Promise<AuthResponse['user']> => {
    const response = await userManagementApiClient.put<AuthResponse['user']>('/auth/profile/', data);
    return response.data;
  },
  
  // Upload and update profile image
  updateProfileImage: async (file: File): Promise<AuthResponse['user']> => {
    // First get the user ID
    const userInfo = tokenStorage.getUserInfo();
    if (!userInfo || !userInfo.id) {
      throw new Error('No user ID available in token');
    }
    
    // Create a FileReader to convert the file to a base64 string
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const base64String = event.target?.result as string;
          
          // Send the update with the base64 image string
          const response = await userManagementApiClient.put<UserResponse>(
            `/users/${userInfo.id}/`,
            {
              profile_image: base64String
            }
          );
          
          return resolve(response.data);
        } catch (error) {
          return reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // Read the file as a data URL (base64)
      reader.readAsDataURL(file);
    });
  },
  
  // Check if authenticated (verifies token)
  checkAuth: async (): Promise<boolean> => {
    try {
      await userManagementApiClient.get('/auth/check/');
      return true;
    } catch (error) {
      return false;
    }
  }
}; 