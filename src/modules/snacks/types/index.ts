export interface Snack {
  id: number;
  name: string;
  credits: number;
  active: boolean;
}

export interface SaveSnackDto {
  id?: number;
  name: string;
  credits: number;
  active?: boolean;
}
