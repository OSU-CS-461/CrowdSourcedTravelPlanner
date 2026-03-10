import { useState } from "react";



type DestinationSearchProps = {
  onSubmit: (destination: string) => void;
};

export default function DestinationSearch({ onSubmit }: DestinationSearchProps) {
  const [destinationInput, setDestinationInput] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formattedDest = destinationInput
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    onSubmit(formattedDest);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Search Destination"
        value={destinationInput}
        onChange={(e) => setDestinationInput(e.target.value)}
        aria-label="Search city or zip code"
      />
      <button type="submit">Search</button>
    </form>
  );
}