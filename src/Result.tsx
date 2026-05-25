interface ResultProps {
  score: number;
  total: number;
}

const fontStyle = {
  fontFamily: 'Roboto, sans-serif'
};

export function Result({ score, total }: ResultProps) {
  return (
    <div style={fontStyle}>
      <h1 style={fontStyle}>Your score: {score} / {total}</h1>
    </div>
  );
}