import { Router } from 'express';
import prisma from '../prismaClient'; 

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { id } = req.params; // 'id' comes from the parent route defined in app.use
    const reviews = await prisma.review.findMany({
      where: { experienceId: Number(id) },
      include: { user: true }, // To get the userName
      orderBy: { dateCreated: 'desc' }
    });
    
    // Map DB fields to match your Frontend 'Review' type
    const formattedReviews = reviews.map(rev => ({
      id: rev.id.toString(),
      experienceId: rev.experienceId.toString(),
      userId: rev.userId.toString(),
      userName: rev.user?.username || "Anonymous",
      rating: rev.rating,
      comment: rev.reviewText,
      createdAt: rev.dateCreated
    }));

    res.json(formattedReviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

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

router.put('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const updatedReview = await prisma.review.update({
      where: { id: Number(reviewId) }, // <--- THIS IS IT
      data: {
        rating: Number(rating),
        reviewText: comment,
      },
    });

    res.json(updatedReview);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const idNum = Number(reviewId);

    await prisma.review.delete({
      where: { id: idNum },
    });

    res.status(204).send(); 
  } catch (error) {
    // If Prisma can't find the record, it throws an error. 
    // We catch it here so the server doesn't "500".
    console.error("DELETE ERROR:", error);
    res.status(404).json({ error: "Review not found or already deleted" });
  }
});

export default router;