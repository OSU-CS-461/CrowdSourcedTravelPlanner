type Props = {
  experienceId: string;
  isOwner: boolean;
};


export default function ReviewsSection({ experienceId, isOwner }: Props) {
  return (
    <section>
      <h2>Reviews</h2>

      <div style={{ marginBottom: "1rem", padding: "1rem", border: "1px dashed #ccc" }}>
        <h3>Info for implementation</h3>

        <p>
          This section is reserved for displaying and managing reviews associated
          with an experience.
        </p>

        <p>
          <strong>Context:</strong> Each experience can have zero or more reviews.
          Reviews are expected to be associated with an experience via its ID.
        </p>

        <p>
          <strong>Available props:</strong>
        </p>
        <ul>
          <li>
            <code>experienceId</code>: <code>{experienceId}</code> — the ID of the
            experience whose reviews should be shown
          </li>
          <li>
            <code>isOwner</code>: <code>{String(isOwner)}</code> — whether the
            currently logged-in user owns the experience
          </li>
        </ul>

        <p>
          <strong>Expected responsibilities (high-level):</strong>
        </p>
        <ul>
          <li>Fetch and display a list of reviews for this experience</li>
          <li>Display review metadata (e.g., rating, text, author, date)</li>
          <li>Allow authenticated users to create a review</li>
          <li>
            Optionally allow deletion or moderation (rules up to implementation)
          </li>
        </ul>

        <p>
          <strong>Notes:</strong>
        </p>
        <ul>
          <li>
            This component is intentionally minimal and contains no logic yet
          </li>
          <li>
            Feel free to restructure, extract subcomponents, or remove this text
            once implementation begins
          </li>
          <li>
            Types are defined in <code>src/features/reviews/types/review.ts</code>
          </li>
        </ul>

        <p>
          This text is meant as temporary guidance and can be deleted or replaced
          freely during development.
        </p>
      </div>

      {/* Reviews UI will be implemented here */}
    </section>
  );
}
