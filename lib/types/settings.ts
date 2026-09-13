/** Site-wide config, admin-editable. */
export interface AppSettings {
  siteName: string;
  registrationOpen: boolean;
  updatedAt: string; // ISO
}

export interface UpdateAppSettingsInput {
  siteName?: string;
  registrationOpen?: boolean;
}

/** Self-service profile/password update (the signed-in user's own account). */
export interface UpdateSelfInput {
  name?: string | null;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}
