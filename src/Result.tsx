interface ResultProps {
  score: number;
  maxScore: number;
}

export function Result({ score, maxScore }: ResultProps) {
  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', textAlign: 'center', marginTop: '50px' }}>
      <h1 style={{ fontFamily: 'Roboto, sans-serif' }}>Your score: {score} / {maxScore}</h1>
    </div>
  );
}