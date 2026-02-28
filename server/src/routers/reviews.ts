import { Router } from 'express';
import prisma from '../prismaClient'; 

const router = Router({ mergeParams: true });

router.post('/', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body; 

    const newReview = await prisma.review.create({
      data: {
        rating: Number(rating),
        reviewText: comment,        // Use reviewText from Schema
        experienceId: Number(id),
        userId: 1,                  // Hardcode ID 1 for now just to test
      }
    });
    res.status(201).json(newReview);
  } catch (error) {
    console.error("CRASH PREVENTED:", error); 
    res.status(500).json({ error: "Database error" });
  }
});

export default router;