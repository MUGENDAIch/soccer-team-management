// src/services/permissionService.ts
export type Permission = "admin" | "manager" | "member" | "guest";

export interface PermissionConfig {
  canRegisterMatch: boolean;
  canManageMembers: boolean;
  canViewStats: boolean;
  canViewMatches: boolean;
}

export const PERMISSION_CONFIGS: Record<Permission, PermissionConfig> = {
  admin: {
    canRegisterMatch: true,
    canManageMembers: true,
    canViewStats: true,
    canViewMatches: true,
  },
  manager: {
    canRegisterMatch: true,
    canManageMembers: false,
    canViewStats: true,
    canViewMatches: true,
  },
  member: {
    canRegisterMatch: false,
    canManageMembers: false,
    canViewStats: true,
    canViewMatches: true,
  },
  guest: {
    canRegisterMatch: false,
    canManageMembers: false,
    canViewStats: false,
    canViewMatches: true,
  },
};

export class PermissionService {
  private currentUserPermission: Permission = "guest";
  private currentUserName: string | null = null;

  setCurrentUser(name: string, permission: Permission) {
    this.currentUserName = name;
    this.currentUserPermission = permission;
  }

  getCurrentUser(): { name: string | null; permission: Permission } {
    return {
      name: this.currentUserName,
      permission: this.currentUserPermission,
    };
  }

  hasPermission(action: keyof PermissionConfig): boolean {
    const config = PERMISSION_CONFIGS[this.currentUserPermission];
    return config[action];
  }

  getPermissionLevel(): Permission {
    return this.currentUserPermission;
  }

  getPermissionDescription(permission: Permission): string {
    switch (permission) {
      case "admin":
        return "管理者 - 全ての機能を使用可能";
      case "manager":
        return "マネージャー - 試合登録と統計閲覧が可能";
      case "member":
        return "メンバー - 統計と試合結果の閲覧のみ";
      case "guest":
        return "ゲスト - 試合結果の閲覧のみ";
      default:
        return "不明な権限";
    }
  }

  isValidPermission(permission: string): permission is Permission {
    return ["admin", "manager", "member", "guest"].includes(permission);
  }
}

// シングルトンインスタンス
export const permissionService = new PermissionService();
