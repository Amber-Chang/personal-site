export type AdminLoginFormState = {
  error: string | null;
  ok: boolean;
};

export const initialAdminLoginFormState: AdminLoginFormState = {
  error: null,
  ok: false,
};
