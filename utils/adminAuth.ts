import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
);

export interface AdminUser {
  id: string;
  role: string;
  loginTime: string;
}

export async function verifyAdminToken(request: NextRequest): Promise<AdminUser | null> {
  try {
    const token = request.cookies.get("admin_token")?.value;
    
    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      id: payload.id as string,
      role: payload.role as string,
      loginTime: payload.loginTime as string
    };
  } catch (error) {
    console.error("❌ JWT verification failed:", error);
    return null;
  }
}

export function requireAdmin(handler: (req: NextRequest, admin: AdminUser) => Promise<Response>) {
  return async (req: NextRequest) => {
    const admin = await verifyAdminToken(req);
    
    if (!admin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin access required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return handler(req, admin);
  };
}

// Client-side admin authentication hook
export function useAdminAuth() {
  const checkAuth = async (): Promise<AdminUser | null> => {
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      
      return null;
    } catch (error) {
      console.error("Auth check failed:", error);
      return null;
    }
  };

  const login = async (id: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id, password })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/admin/login', {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return { checkAuth, login, logout };
}