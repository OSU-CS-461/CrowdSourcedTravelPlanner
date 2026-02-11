export type Review = {
  id: number | string;
  // each review is tied to ONE experience
  experienceId: number | string;
  rating: number;
  comment: string;
  createdBy: number | string;
  createdAt: string;
};
