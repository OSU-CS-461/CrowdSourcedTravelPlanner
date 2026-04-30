export type ReviewMedia = {
  id: string;
  url: string;
  type: 'image' | 'video';
  alt?: string;
};

export type Review = {
  id: number | string;
  experienceId: number | string;
  userId: number | string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  createdBy?: number | string;
  media?: ReviewMedia[];
};