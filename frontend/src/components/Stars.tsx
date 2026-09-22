export default function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating} out of 5`}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}
