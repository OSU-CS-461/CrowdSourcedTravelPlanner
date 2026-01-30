import ExperienceCard, { type Experience } from "./ExperienceCard";

interface ExperienceListProps {
  experiences: Experience[];
  leadingCard?: React.ReactNode;
}

export default function ExperienceList({ experiences, leadingCard }: ExperienceListProps) {
  if (!experiences.length && !leadingCard) {
    return <p>No experiences to show.</p>;
  }

  return (
    <section className="experience-list">
      {leadingCard}
      {experiences.map((experience) => (
        <ExperienceCard
          key={experience.id ?? `${experience.title}-${experience.dateCreated}`}
          experience={experience}
        />
      ))}
    </section>
  );
}
