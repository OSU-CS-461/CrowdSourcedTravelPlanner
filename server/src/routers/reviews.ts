import { Router } from 'express';
import prisma from '../prismaClient';
import { authenticate } from '../middleware/auth';
import * as reviewService from '../services/reviewService';

const router = Router({ mergeParams: true });

// --- GET (Public) ---
router.get('/', async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({
      where: { experienceId: Number(id) },
      include: { 
        user: true, 
        media: true
      },
      orderBy: { dateCreated: 'desc' }
    });
    
    const formattedReviews = reviews.map(rev => ({
      id: rev.id.toString(),
      experienceId: rev.experienceId.toString(),
      userId: rev.userId.toString(),
      userName: rev.user?.username || "Anonymous",
      rating: rev.rating,
      comment: rev.reviewText,
      createdAt: rev.dateCreated,
      
      media: rev.media?.map((m: any) => ({
        id: m.id.toString(),
        url: m.url,
        type: m.type, // 'image' or 'video'
        alt: m.altText || ""
      })) || []
    }));

    res.json(formattedReviews);
  } catch {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// --- POST (Protected) ---
router.post('/', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const newReview = await reviewService.createReview(
      Number(id), 
      userId, 
      req.body
    );
    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Database error" });
  }
});

// --- PUT (Protected + Ownership Check) ---
router.put('/:reviewId', authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const updatedReview = await reviewService.updateReview(
      Number(reviewId),
      userId,
      req.body
    );

    res.json(updatedReview);
  } catch (error: any) {
    const status = error.message.includes("Forbidden") ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
});

// --- DELETE (Protected + Ownership Check) ---
router.delete('/:reviewId', authenticate, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    await reviewService.deleteReview(Number(reviewId), userId);
    
    res.status(204).send(); 
  } catch (error: any) {
    const status = error.message.includes("Forbidden") ? 403 : 404;
    res.status(status).json({ error: error.message });
  }
});

export default router;