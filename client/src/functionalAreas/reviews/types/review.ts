export type Review = {
  id: number | string;
  experienceId: number | string;
  userId: number | string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  createdBy?: number | string;
};
