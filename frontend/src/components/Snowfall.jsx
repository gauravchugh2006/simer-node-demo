import { useMemo } from 'react';

const createFlake = (id) => ({
  id,
  delay: Math.random() * 10,
  duration: 10 + Math.random() * 12,
  left: Math.random() * 100,
  size: 2 + Math.random() * 4,
  opacity: 0.35 + Math.random() * 0.4
});

const Snowfall = ({ count = 60 }) => {
  const flakes = useMemo(() => Array.from({ length: count }, (_, index) => createFlake(index)), [count]);

  return (
    <div className="snowfall" aria-hidden="true">
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity
          }}
        />
      ))}
    </div>
  );
};

export default Snowfall;
